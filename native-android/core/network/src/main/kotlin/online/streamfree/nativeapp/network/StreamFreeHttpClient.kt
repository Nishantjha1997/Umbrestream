package online.streamfree.nativeapp.network

import okhttp3.CookieJar
import okhttp3.Dispatcher
import okhttp3.Headers
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit

interface StreamFreeHttpTransport {
  fun get(url: String, headers: Map<String, String> = emptyMap()): HttpResponse
}

class StreamFreeHttpClient(
  private val policy: SafeUrlPolicy,
  private val metrics: NetworkMetrics = NoopNetworkMetrics,
  client: OkHttpClient? = null,
) : StreamFreeHttpTransport {
  private val validator = SafeUrlValidator(policy)
  private val client = client ?: OkHttpClient.Builder()
    .cookieJar(CookieJar.NO_COOKIES)
    .dispatcher(Dispatcher().apply {
      maxRequests = 4
      maxRequestsPerHost = 2
    })
    .dns(SafeDns(validator))
    .followRedirects(false)
    .followSslRedirects(false)
    .connectTimeout(10, TimeUnit.SECONDS)
    .readTimeout(15, TimeUnit.SECONDS)
    .writeTimeout(15, TimeUnit.SECONDS)
    .callTimeout(20, TimeUnit.SECONDS)
    .build()

  override fun get(url: String, headers: Map<String, String>): HttpResponse {
    var current = validator.validate(url)
    var redirectCount = 0
    val visited = mutableSetOf(current.toString())
    val safeHeaders = AppOwnedHeaders.validate(headers)
    val requestHeaders = Headers.Builder().apply {
      safeHeaders.forEach { (name, value) -> add(name, value) }
    }.build()

    while (true) {
      val startedAt = System.nanoTime()
      val request = Request.Builder()
        .url(current)
        .headers(requestHeaders)
        .get()
        .build()

      val response = try {
        client.newCall(request).execute()
      } catch (error: SocketTimeoutException) {
        record(current, null, startedAt, "timeout")
        throw NetworkFailure.Timeout(current.host, error)
      } catch (error: NetworkFailure) {
        record(current, null, startedAt, "rejected")
        throw error
      } catch (error: Exception) {
        record(current, null, startedAt, "transport_error")
        throw NetworkFailure.Transport(current.host, error)
      }

      response.use { responseBody ->
        val code = responseBody.code
        if (code in setOf(301, 302, 303, 307, 308)) {
          if (redirectCount >= policy.maxRedirects) {
            record(current, code, startedAt, "redirect_limit")
            throw NetworkFailure.RedirectLimit(current.host)
          }
          val location = responseBody.header("Location")
            ?: throw NetworkFailure.MissingRedirectLocation(current.host)
          val next = validator.validateRedirect(current, location)
          if (!visited.add(next.toString())) {
            record(current, code, startedAt, "redirect_loop")
            throw NetworkFailure.RedirectLoop(current.host)
          }
          redirectCount += 1
          current = next
          record(current, code, startedAt, "redirect")
          return@use
        }

        if (!responseBody.isSuccessful) {
          record(current, code, startedAt, "http_error")
          throw NetworkFailure.HttpStatus(code, current.host)
        }

        val body = responseBody.body
        val declaredLength = body.contentLength()
        if (declaredLength > policy.maxResponseBytes) {
          record(current, code, startedAt, "response_too_large")
          throw NetworkFailure.ResponseTooLarge(current.host)
        }
        val bytes = body.source().readByteArray(policy.maxResponseBytes + 1L)
        if (bytes.size.toLong() > policy.maxResponseBytes) {
          record(current, code, startedAt, "response_too_large")
          throw NetworkFailure.ResponseTooLarge(current.host)
        }
        record(current, code, startedAt, "success")
        return HttpResponse(current.toString(), code, responseBody.headers.toMultimap().mapValues { it.value.last() }, bytes)
      }
    }
  }

  private fun record(url: okhttp3.HttpUrl, statusCode: Int?, startedAt: Long, outcome: String) {
    metrics.record(
      NetworkMetric(
        host = url.host,
        statusCode = statusCode,
        durationMs = (System.nanoTime() - startedAt) / 1_000_000L,
        outcome = outcome,
      ),
    )
  }
}
