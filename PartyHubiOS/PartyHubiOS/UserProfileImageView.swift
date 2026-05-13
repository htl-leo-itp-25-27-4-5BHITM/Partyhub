import SwiftUI

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
            Circle()
                .fill(Color.gray.opacity(0.2))
            
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
                    .foregroundStyle(.white)
                    .padding(size * 0.2)
            }
        }
        .frame(width: size, height: size)
        .overlay(
            Circle()
                .stroke(
                    showBorder ? Color("primary pink") : Color.clear,
                    lineWidth: showBorder ? 1 : 0
                )
        )
        .task {
            await loadProfilePicture()
        }
    }
    
    private func loadProfilePicture() async {
        if isLoading { return }
        isLoading = true
        profileImage = nil
        defer { isLoading = false }
        
        print("Upload profile picture for user \(userId)...")
        
        do {
            let image = try await ApiService.shared.fetchProfilePicture(userId: userId)
            print("Profile picture successfully uploaded for user \(userId)")
            await MainActor.run {
                self.profileImage = image
            }
        } catch is CancellationError {
            return
        } catch let error as NSError where error.domain == NSURLErrorDomain && error.code == NSURLErrorCancelled {
            return
        } catch let error as NSError where error.domain == "NotFound" && error.code == 404 {
            return
        } catch {
            print("Error loading user profile picture \(userId):")
            print("Error Domain: \((error as NSError).domain)")
            print("Error Code: \((error as NSError).code)")
            print("Error: \(error.localizedDescription)")
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
