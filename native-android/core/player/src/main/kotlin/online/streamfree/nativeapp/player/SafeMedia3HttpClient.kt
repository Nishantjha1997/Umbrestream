package online.streamfree.nativeapp.player

import okhttp3.CookieJar
import okhttp3.Dispatcher
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import online.streamfree.nativeapp.network.NetworkFailure
import online.streamfree.nativeapp.network.SafeDns
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.SafeUrlValidator
import java.util.concurrent.TimeUnit

internal class SafeMedia3HttpClient(
  private val policy: SafeUrlPolicy,
) {
  private val validator = SafeUrlValidator(policy)

  fun build(): OkHttpClient = OkHttpClient.Builder()
    .cookieJar(CookieJar.NO_COOKIES)
    .dispatcher(Dispatcher().apply {
      maxRequests = 4
      maxRequestsPerHost = 2
    })
    .dns(SafeDns(validator))
    .followRedirects(false)
    .followSslRedirects(false)
    .addInterceptor(SafeRedirectInterceptor(validator, policy.maxRedirects))
    .connectTimeout(10, TimeUnit.SECONDS)
    .readTimeout(15, TimeUnit.SECONDS)
    .writeTimeout(15, TimeUnit.SECONDS)
    .callTimeout(20, TimeUnit.SECONDS)
    .build()
}

private class SafeRedirectInterceptor(
  private val validator: SafeUrlValidator,
  private val maxRedirects: Int,
) : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    var request = chain.request().newBuilder()
      .url(validator.validate(chain.request().url))
      .build()
    var redirects = 0
    val visited = mutableSetOf(request.url.toString())

    while (true) {
      val response = chain.proceed(request)
      if (response.code !in REDIRECT_CODES) return response
      if (redirects >= maxRedirects) {
        response.close()
        throw NetworkFailure.RedirectLimit(request.url.host)
      }
      val location = response.header("Location")
        ?: run {
          response.close()
          throw NetworkFailure.MissingRedirectLocation(request.url.host)
        }
      val nextUrl = try {
        validator.validateRedirect(request.url, location)
      } catch (error: Throwable) {
        response.close()
        throw error
      }
      if (!visited.add(nextUrl.toString())) {
        response.close()
        throw NetworkFailure.RedirectLoop(request.url.host)
      }
      response.close()
      redirects += 1
      request = request.newBuilder().url(nextUrl).build()
    }
  }

  private companion object {
    val REDIRECT_CODES = setOf(301, 302, 303, 307, 308)
  }
}
