import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Create and configure the main window
        window = UIWindow(frame: UIScreen.main.bounds)
        
        // Initialize the Capacitor bridge view controller
        let bridge = CAPBridgeViewController()
        
        // Configure the bridge to respect safe area insets
        bridge.view.backgroundColor = .black
        
        // Inject safe area CSS with multiple attempts to ensure it's applied
        for delay in [0.3, 0.8, 1.5] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak bridge] in
                self.injectSafeAreaStyles(into: bridge)
            }
        }
        
        // Set as the root view controller
        window?.rootViewController = bridge
        
        // Make the window visible
        window?.makeKeyAndVisible()
        
        return true
    }
    
    private func injectSafeAreaStyles(into bridge: CAPBridgeViewController?) {
        guard let webView = bridge?.webView else {
            print("⚠️ WebView not available yet")
            return
        }
        
        let cssInjection = """
        (function() {
            console.log('🔧 Injecting safe area styles...');
            
            // Ensure viewport-fit=cover is set FIRST
            var meta = document.querySelector('meta[name="viewport"]');
            if (meta) {
                var content = meta.getAttribute('content');
                if (content && !content.includes('viewport-fit')) {
                    meta.setAttribute('content', content + ', viewport-fit=cover');
                    console.log('✅ Added viewport-fit=cover to meta tag');
                }
            } else {
                // Create meta tag if it doesn't exist
                var newMeta = document.createElement('meta');
                newMeta.name = 'viewport';
                newMeta.content = 'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';
                document.head.appendChild(newMeta);
                console.log('✅ Created new viewport meta tag');
            }
            
            // Remove any existing safe-area style to avoid duplicates
            var existingStyle = document.getElementById('safe-area-insets-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Inject CSS for safe area insets
            var style = document.createElement('style');
            style.id = 'safe-area-insets-style';
            style.innerHTML = `
                :root {
                    --safe-area-inset-top: env(safe-area-inset-top);
                    --safe-area-inset-bottom: env(safe-area-inset-bottom);
                }
                body {
                    padding-top: env(safe-area-inset-top) !important;
                    padding-bottom: env(safe-area-inset-bottom) !important;
                    box-sizing: border-box !important;
                }
                /* Also apply to common container elements if body padding doesn't work */
                body > * {
                    margin-top: 0 !important;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Safe area styles injected');
            
            return 'Safe area styles applied';
        })();
        """
        
        webView.evaluateJavaScript(cssInjection) { result, error in
            if let error = error {
                print("❌ Error injecting styles: \(error.localizedDescription)")
            } else {
                print("✅ Successfully injected safe area styles: \(result ?? "no result")")
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
