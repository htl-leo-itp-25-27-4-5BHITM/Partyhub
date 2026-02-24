import SwiftUI

struct PartyView: View {
    
    var body: some View {
        ZStack {
            
            
            ScrollView {
                VStack(spacing: 30) {
                    
                    VStack(spacing: 15) {
                        Text("ALL PARTIES")
                            .font(.system(size: 55, weight: .black))
                            .foregroundColor(Color.primaryDarkBlue)
                        
                        
                        Button(action: { }) {
                            HStack {
                                Text("Create New Party")
                                Image(systemName: "plus")
                            }
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 25)
                            .background(Color.primaryDarkBlue)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .shadow(color:.primaryDarkBlue.opacity(0.5), radius: 10)
                        }
                    }
                    .padding(.top, 40)
                    
                    VStack(spacing: 15) {
                        PartyCard(name: "Summer Blast", location: "Berlin, Strandbar", date: "15. Aug 2026")
                        PartyCard(name: "Techno Night", location: "München, Club X", date: "22. Aug 2026")
                        PartyCard(name: "House Warming", location: "Hamburg, Loft 4", date: "01. Sept 2026")
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
    
    struct PartyCard: View {
        let name: String
        let location: String
        let date: String
        
        var body: some View {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text(name)
                        .font(.headline)
                        .foregroundColor(.primaryDarkBlue)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                        Text(location)
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    
                    Text(date)
                        .font(.caption)
                        .foregroundColor(.pink)
                        .fontWeight(.semibold)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.gray)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(15)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }
    
}
