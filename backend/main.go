package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
)

type ErrorLog struct {
	Error     string `json:"error"`
	Query     string `json:"query"`
	Timestamp string `json:"timestamp"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"}

	for _, allowedOrigin := range allowedOrigins {
		if origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			break
		}
	}

	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}

func logErrorHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w, r)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var errorLog ErrorLog
	if err := json.NewDecoder(r.Body).Decode(&errorLog); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Log the error to console (in production, you might want to use a proper logging service)
	log.Printf("Error logged - Query: %s, Error: %s, Timestamp: %s",
		errorLog.Query, errorLog.Error, errorLog.Timestamp)

	// You can add database logging here if needed
	// For now, we'll just log to console and return success

	response := ErrorResponse{
		Success: true,
		Message: "Error logged successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w, r)

	response := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "vehicle-chatbot-backend",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"}

		log.Printf("CORS Middleware - Origin: %s, Method: %s, Path: %s", origin, r.Method, r.URL.Path)

		// Set CORS headers for all requests
		if origin != "" {
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					break
				}
			}
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			log.Printf("Handling OPTIONS request for %s", r.URL.Path)
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()
	api.HandleFunc("/log-error", logErrorHandler).Methods("POST")
	api.HandleFunc("/health", healthHandler).Methods("GET")

	// Apply CORS middleware
	handler := corsMiddleware(router)

	fmt.Printf("Server starting on port %s\n", port)
	fmt.Println("Available endpoints:")
	fmt.Println("  POST /api/log-error - Log errors from frontend")
	fmt.Println("  GET  /api/health   - Health check")

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
