package online.streamfree.nativeapp.network

import okhttp3.Dns
import java.net.InetAddress
import java.net.UnknownHostException

class SafeDns(private val validator: SafeUrlValidator) : Dns {
  override fun lookup(hostname: String): List<InetAddress> {
    val host = validator.validateHost(hostname)
    val addresses = try {
      InetAddress.getAllByName(host).toList()
    } catch (error: UnknownHostException) {
      throw error
    }
    validator.validateResolvedAddresses(host, addresses)
    return addresses
  }
}
