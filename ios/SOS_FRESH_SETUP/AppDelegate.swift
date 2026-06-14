import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleMaps
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // 1. Firebase first
    FirebaseApp.configure()

    // 2. Google Maps key
    let apiKey = Bundle.main.object(forInfoDictionaryKey: "GOOGLE_API_KEY") as? String ?? ""
    GMSServices.provideAPIKey(apiKey)

   
   

    // 4. Notifications
    UNUserNotificationCenter.current().delegate = self
    Messaging.messaging().delegate = self
    application.registerForRemoteNotifications()

    // 5. React Native setup
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    // FIX: Removed unnecessary DispatchQueue.global wrapping which caused
    // a race condition where background notifications could arrive before
    // the JS bundle was loaded.
    factory.startReactNative(
      withModuleName: "SOS_FRESH_SETUP",
      in: self.window,
      launchOptions: launchOptions
    )

    return true
  }

  // Forward APNs token to Firebase
  func application(_ application: UIApplication,
                   didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
  }

  func application(_ application: UIApplication,
                   didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Failed to register for remote notifications: \(error)")
  }

  // Show notifications when app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                               willPresent notification: UNNotification,
                               withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .sound, .badge])
  }

  // Handle notification tap (background/foreground)
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                               didReceive response: UNNotificationResponse,
                               withCompletionHandler completionHandler: @escaping () -> Void) {
    completionHandler()
  }

  // FIX: Call Messaging.appDidReceiveMessage so Firebase processes the message
  // and triggers setBackgroundMessageHandler in JS. Without this, background
  // notifications are silently dropped and never reach the JS layer.
 func application(
  _ application: UIApplication,
  didReceiveRemoteNotification userInfo: [AnyHashable : Any],
  fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
) {

  print("📩 APNS Payload: \(userInfo)")

  Messaging.messaging().appDidReceiveMessage(userInfo)

  completionHandler(.newData)
}

  // FIX: Implement MessagingDelegate token refresh callback.
  // Without this, FCM token refreshes are silently dropped.
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmRegistrationToken: String?) {
    print("🔑 FCM token refreshed: \(fcmRegistrationToken ?? "nil")")
    // If you need to send the updated token to your backend, do it here.
    // Example:
    // if let token = fcmRegistrationToken {
    //   YourAPIService.updateFCMToken(token)
    // }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}