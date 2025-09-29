package com.example.SelfOrderingRestaurant;

import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Collections;

public class GoogleIdTokenGenerator {
    public static String getIdToken() throws IOException {
        // Path to your service account JSON key file
        String keyPath = "D:\\UTC2\\SelfOrderingRestaurant\\selforderingrestaurant-fc1108da42f1.json";

        try (FileInputStream serviceAccountStream = new FileInputStream(keyPath)) {
            // Load the service account credentials
            GoogleCredentials credentials = ServiceAccountCredentials.fromStream(serviceAccountStream)
                    .createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));

            // Refresh the credentials to obtain the token
            credentials.refresh();

            // Get the ID token
            String idToken = credentials.getAccessToken().getTokenValue();
            return idToken;
        }
    }

    public static void main(String[] args) {
        try {
            String idToken = getIdToken();
            System.out.println("ID Token: " + idToken);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
