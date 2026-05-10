import SwiftUI

/// Wiederverwendbare View für die Anzeige von Benutzer-Profilbildern
/// - Lädt das Bild vom Backend oder zeigt ein Default-Bild
/// - Cached Bilder für bessere Performance
/// - Zeigt einen Loading-State während das Bild geladen wird
struct UserProfileImageView: View {
    let userId: Int
    let size: CGFloat
    let showBorder: Bool
    
    @State private var profileImage: UIImage? = nil
    @State private var isLoading = false
    @State private var showError = false
    
    init(userId: Int, size: CGFloat = 60, showBorder: Bool = true) {
        self.userId = userId
        self.size = size
        self.showBorder = showBorder
    }
    
    var body: some View {
        ZStack {
            // Background Kreis
            Circle()
                .fill(Color.gray.opacity(0.2))
            
            // Profilbild oder Default-Icon
            if let image = profileImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .clipShape(Circle())
            } else if isLoading {
                ProgressView()
                    .frame(width: size * 0.5, height: size * 0.5)
            } else {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(.gray)
                    .padding(size * 0.2)
            }
        }
        .frame(width: size, height: size)
        .overlay(
            Circle()
                .stroke(
                    showBorder ? Color("primary pink") : Color.clear,
                    lineWidth: showBorder ? 2 : 0
                )
        )
        .task(id: userId) {
            guard profileImage == nil, !isLoading else { return }
            await loadProfilePicture()
        }
    }
    
    private func loadProfilePicture() async {
        isLoading = true
        defer { isLoading = false }
        
        print("🖼️ Lade Profilbild für User \(userId)...")
        
        do {
            let image = try await ApiService.shared.fetchProfilePicture(userId: userId)
            print("✅ Profilbild erfolgreich geladen für User \(userId)")
            await MainActor.run {
                self.profileImage = image
            }
        } catch is CancellationError {
            // SwiftUI cancelt .task häufig bei Re-Renders; kein echter Fehler.
            return
        } catch let error as NSError where error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled {
            // URLSession-Abbruch bei View-Neuzeichnung ist erwartbar.
            return
        } catch let error as NSError where error.domain == "NotFound" && error.code == 404 {
            // User hat kein eigenes Profilbild -> Default-Icon anzeigen, kein Fehlerlog nötig.
            return
        } catch {
            print("❌ Fehler beim Laden von Profilbild für User \(userId):")
            print("   Error Domain: \((error as NSError).domain)")
            print("   Error Code: \((error as NSError).code)")
            print("   Error: \(error.localizedDescription)")
            await MainActor.run {
                self.showError = true
            }
        }
    }
}

#Preview {
    VStack(spacing: 30) {
        UserProfileImageView(userId: 1, size: 80)
        UserProfileImageView(userId: 7, size: 60)
        UserProfileImageView(userId: 99999, size: 100)
    }
    .padding()
}
