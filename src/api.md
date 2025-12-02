## Conventions
- Base URL: https://aafa.mycartly.in/api
- Authentication: OTP-based auth issues JWT bearer tokens; include Authorization: Bearer <token> unless noted.
- Roles: user, provider, admin. Endpoints specify required role(s).
- Formats: JSON bodies/responses, UTC timestamps (ISO 8601), amounts as decimal strings.
- Media URLs: All uploaded assets are stored and returned as absolute URLs using the app base (httpss://aafa.mycartly.in/api/public/...). If you provide a relative path, the backend automatically prefixes it.

## Booking System: Rapido Model

The platform uses a *Rapido/Uber-style booking model* where:
- Users don't select a specific provider upfront
- System automatically finds nearby providers based on user location
- Multiple providers receive notifications simultaneously
- First provider to accept gets the booking
- Real-time location tracking for both parties after acceptance

See section 5 for detailed booking flow documentation.

## 1. Authentication & Profile
- *POST* https://aafa.mycartly.in/api/auth/login (public)
  - Body: { "phone_number": "<10/12-digit number without +91>" }
  - Response: { "message": "OTP sent successfully", "phone": "+91XXXXXXXXXX", "session_id": "<sid>" }
- *POST* https://aafa.mycartly.in/api/auth/verify (public)
  - Body: { "phone_number": "+91XXXXXXXXXX", "otp": "123456" }
  - Response (registered user): { "verified": true, "registered": true, "token": "<jwt>", "user": { ... } }
  - Response (new user): { "verified": true, "registered": false }
- *POST* https://aafa.mycartly.in/api/auth/register (public; requires prior OTP verification)
  - Body: { "full_name": "", "email": "", "gender": "", "state": "", "city": "" }
  - Response: { "message": "User registered successfully", "user": { ... } }
- *POST* https://aafa.mycartly.in/api/auth/verify-register (public)
  - Body: { "phone_number": "+91...", "otp": "123456" }
  - Response: { "verified": true, "message": "Phone verified for registration" }
- *PUT* https://aafa.mycartly.in/api/user/profile/update (user)
  - Body: { "full_name": "", "email": "", "gender": "", "state": "", "city": "" }
  - Response: { "message": "Profile updated", "user": { ... } }

## 2. Category & Service Management
- Categories (admin):
  - *POST* https://aafa.mycartly.in/api/admin/categories
    - Accepts: multipart/form-data (file field image) or JSON with "image" URL
    - Body: { "name": "", "image": "" }
    - Response: { "category": { "id": 0, "name": "", "image_url": "" } }
  - *POST* https://aafa.mycartly.in/api/admin/categories/upload
    - Accepts: multipart/form-data with file field image
    - Response: { "image_url": "public/category/<filename>" }
  - *GET* https://aafa.mycartly.in/api/admin/categories
    - Response: { "categories": [ { "id": 0, "name": "", "image_url": "", "created_at": "", "updated_at": "" } ] }
  - *GET* https://aafa.mycartly.in/api/admin/categories/<category_id>
    - Response: { "category": { "id": 0, "name": "", "image_url": "", "created_at": "", "updated_at": "" } }
  - *PUT* https://aafa.mycartly.in/api/admin/categories/<category_id>
    - Accepts: multipart/form-data (file field image) or JSON with "image" URL
    - Body: { "name": "", "image": "" }
    - Response: { "message": "Category updated successfully", "category": { ... } }
  - *DELETE* https://aafa.mycartly.in/api/admin/categories/<category_id>
    - Response: { "message": "Category deleted successfully" }

- Services (admin):
  - *POST* https://aafa.mycartly.in/api/admin/services
    - Accepts: multipart/form-data (file field image) or JSON with "image" URL
    - Body (required): { "category_id": 0, "title": "", "price_original": "999.00" }
    - Body (optional fields): "price_discounted": "799.00", "no_of_sessions": 0, "no_of_months": 0, "features": "", "description": "", "image": ""
    - Response: { "service": { "id": 0, "category_id": 0, "title": "", "price_original": "999.00", "price_discounted": "799.00", "no_of_sessions": 0, "no_of_months": 0, "features": "", "description": "", "image_url": "" } }
  - *POST* https://aafa.mycartly.in/api/admin/services/upload
    - Accepts: multipart/form-data with file field image
    - Response: { "image_url": "public/services/<filename>" }
  - *GET* https://aafa.mycartly.in/api/admin/services
    - Query: category_id (optional)
    - Response: { "services": [ { "id": 0, "category_id": 0, "title": "", "price_original": "999.00", "price_discounted": "799.00", "no_of_sessions": 0, "no_of_months": 0, "features": "", "description": "", "image_url": "", "created_at": "", "updated_at": "" } ] }
  - *GET* https://aafa.mycartly.in/api/admin/services/<service_id>
    - Response: { "service": { "id": 0, "category_id": 0, "title": "", "price_original": "999.00", "price_discounted": "799.00", "no_of_sessions": 0, "no_of_months": 0, "features": "", "description": "", "image_url": "", "created_at": "", "updated_at": "" } }
  - *PUT* https://aafa.mycartly.in/api/admin/services/<service_id>
    - Accepts: multipart/form-data (file field image) or JSON with "image" URL
    - Body (required): { "category_id": 0, "title": "", "price_original": "999.00" }
    - Body (optional fields): "price_discounted": "799.00", "no_of_sessions": 0, "no_of_months": 0, "features": "", "description": "", "image": ""
    - Response: { "message": "Service updated successfully", "service": { ... } }
  - *DELETE* https://aafa.mycartly.in/api/admin/services/<service_id>
    - Response: { "message": "Service deleted successfully" }

- User:
  - *GET* https://aafa.mycartly.in/api/user/services
    - Response: { "categories": [ { "id": 0, "name": "", "image_url": "", "services": [ { "id": 0, "title": "", "price_original": "999.00", "price_discounted": "799.00", "no_of_sessions": 0, "no_of_months": 0, "features": "", "description": "" } ] } ] }

## 3. Provider Management
- *POST* https://aafa.mycartly.in/api/provider/register (public)
  - Content type: multipart/form-data (preferred) or JSON.
  - Required text fields: full_name, phone_number, email, gender, address, city, state, account_holder_name, bank_name, account_number, ifsc_code.
  - Required array field: services_provided (admin subcategory IDs or objects with subcategory_id/service_id).
    - JSON: services_provided: [1, 2] or [{"subcategory_id":1}]
    - Multipart: send a JSON string ([1,2]) or repeated fields (services_provided[]=1…).
  - Optional array: category_ids (derived from services if omitted).
  - Optional location fields (Rapido model): latitude (decimal), longitude (decimal), is_online (0 or 1, default: 0).
  - Optional uploads: profile_photo, aadhaar_document, pan_document, degree_certificate, previous_work_images (repeat field for multiple images). Any relative URLs provided are auto-prefixed with httpss://aafa.mycartly.in/api/public/....
  - Example multipart snippet (abridged):
    
    -F "full_name=Jane Doe" \
    -F "phone_number=+91857..." \
    -F "email=jane@example.com" \
    -F "gender=female" \
    -F "address=123 Main St" \
    -F "city=Jaipur" \
    -F "state=Rajasthan" \
    -F "account_holder_name=Jane Doe" \
    -F "bank_name=HDFC" \
    -F "account_number=50100123456789" \
    -F "ifsc_code=HDFC0001234" \
    -F "services_provided=[1,2]" \
    -F "category_ids=[3]" \
    -F "profile_photo=@/path/photo.jpg" \
    -F "aadhaar_document=@/path/aadhaar.pdf" \
    -F "previous_work_images=@/path/work1.png" \
    -F "previous_work_images=@/path/work2.png"
    
  - Response:
    json
    {
      "message": "Provider registration submitted",
      "status": "verification_in_progress",
      "provider_id": 12,
      "linked_categories": [3, 4],
      "linked_subcategories": [1, 2],
      "documents": {
        "profile_photo_url": "httpss://aafa.mycartly.in/api/public/provider_docs/profile_photos/...",
        "aadhaar_doc_url": "httpss://aafa.mycartly.in/api/public/provider_docs/aadhaar/...",
        "pan_doc_url": "httpss://aafa.mycartly.in/api/public/provider_docs/pan/...",
        "degree_doc_url": "httpss://aafa.mycartly.in/api/public/provider_docs/degrees/...",
        "previous_work_images": [
          "httpss://aafa.mycartly.in/api/public/provider_docs/work/..."
        ]
      },
      "bank_details": {
        "account_holder_name": "Jane Doe",
        "bank_name": "HDFC",
        "account_number": "50100123456789",
        "ifsc_code": "HDFC0001234"
      },
      "location": {
        "latitude": 26.9124,
        "longitude": 75.7873,
        "is_online": true,
        "last_location_update": "2025-01-20T10:30:00Z"
      }
    }
    
    - The location field is only included if latitude and longitude were provided during registration.
- *PUT* https://aafa.mycartly.in/api/admin/provider/verify/<provider_id> (admin)
  - Body:
    json
    {
      "action": "approve",
      "notes": "All KYC docs validated"
    }
    
    Allowed action values: approve, reject, suspend, reinstate.
    - approve: allowed only when provider status is verification_in_progress or rejected.
    - reject: optional for pending providers, but *requires* "notes" when used; not allowed for already approved providers.
    - suspend: only for currently approved providers and *requires* "notes".
    - reinstate: only for suspended providers (returns them to approved).
  - Response:
    json
    {
      "message": "Provider approved",
      "provider": {
        "id": 42,
        "full_name": "Jane Doe",
        "status": "approved",
        "verification_notes": "All KYC docs validated"
      }
    }
    
- *POST* https://aafa.mycartly.in/api/provider/verify (public/provider app)
  - Body: { "phone_number": "+91XXXXXXXXXX" }
  - Response (not registered): { "registered": false, "redirect_to_registration": true, "message": "Provider not registered" }
  - Response (pending): { "registered": true, "verified": false, "redirect_to_home": false, "show_pending": true, "show_rejected": false, "redirect_to_registration": false, "status": "verification_in_progress", "provider": { ... } }
  - Response (rejected): { "registered": true, "verified": false, "redirect_to_home": false, "show_pending": false, "show_rejected": true, "redirect_to_registration": false, "status": "rejected", "provider": { ... } }
  - Response (verified): { "registered": true, "verified": true, "redirect_to_home": true, "show_pending": false, "show_rejected": false, "redirect_to_registration": false, "status": "approved", "provider": { ... } }
- *GET* https://aafa.mycartly.in/api/provider/top (public)
  - Query: limit (optional)
  - Response: { "providers": [ { "id": 1, "full_name": "", "completed_appointments": 42, "rating": 4.8 } ] }
- *POST* https://aafa.mycartly.in/api/provider/services/add (provider; verified)
  - Body: { "service_name": "", "description": "", "price": "1499.00" }
  - Response: { "service": { ... } }
- *GET* https://aafa.mycartly.in/api/provider/services (provider)
  - Response: { "services": [ ... ] }
- *GET* https://aafa.mycartly.in/api/provider/<provider_id> (public)
  - Response: { "provider": { "details": { ... }, "reviews": [ ... ] } }

## 4. Address & Insurance Management (User)
- *POST* https://aafa.mycartly.in/api/user/address (user)
  - Body: { "user_id": 0, "address": "", "city": "", "state": "", "pincode": "", "country": "" }
  - Response: { "address": { ... } }
- *GET* https://aafa.mycartly.in/api/user/address (user)
  - Query: user_id (required)
  - Response: { "addresses": [ ... ] }
- *PUT* https://aafa.mycartly.in/api/user/address/<address_id> (user)
  - Body: { "user_id": 0, "address": "", "city": "", "state": "", "pincode": "", "country": "" }
  - Response: { "message": "Address updated successfully", "address": { ... } }
- *DELETE* https://aafa.mycartly.in/api/user/address/<address_id> (user)
  - Query: user_id (required)
  - Response: { "message": "Address deleted successfully" }
- *POST* https://aafa.mycartly.in/api/user/insurance/add (user)
  - Body: { "pet_type": "", "breed": "", "pet_name": "", "pet_age": "", "owner_name": "", "email": "", "contact": "", "insurance_type": "" }
  - Response: { "message": "Insurance details saved" }
- *GET* https://aafa.mycartly.in/api/admin/insurance/list (admin)
  - Response: { "insurances": [ ... ] }

## 5. Booking & Appointment Lifecycle (Rapido Model)

The booking system now works like ride-sharing apps (Rapido/Uber model). Here's how it works:

### Booking Flow Overview

1. *User selects service* → System shows nearby providers on map
2. *User creates booking* → System automatically finds nearby providers (within 10km radius)
3. *Notifications sent* → All nearby providers receive booking notifications with sound/tune alerts
4. *First provider accepts* → Booking is confirmed, all other providers are automatically rejected
5. *If provider rejects* → Notification continues to remaining providers
6. *If all reject* → Booking is automatically cancelled
7. *After acceptance* → Both user and provider can track each other's locations in real-time

### 5.1 Get Nearby Providers (Map View)
- *GET* https://aafa.mycartly.in/api/user/providers/nearby (user)
  - Query params: latitude (required), longitude (required), subcategory_id (required), category_id (optional), radius_km (optional, default: 10)
  - Response: { "providers": [ { "id": 1, "full_name": "", "latitude": 0.0, "longitude": 0.0, "distance_km": 2.5, "is_online": true, ... } ], "count": 5 }
  - Returns all nearby *online* service providers for the selected service, sorted by distance
  - Use this endpoint to display providers on a map before booking
  - Only shows providers with is_online = 1 and valid location coordinates

### 5.2 Create Booking (Rapido Model)
- *POST* https://aafa.mycartly.in/api/user/book (user)
  - Body: { "user_id": "", "category_id": "", "subcategory_id": "", "full_name": "", "email": "", "contact_number": "", "pincode": "", "address": "", "state": "", "country": "", "preferred_date": "YYYY-MM-DD", "preferred_time": "HH:MM", "payment_method": "pay_now" | "pay_after", "latitude": 0.0, "longitude": 0.0 }
  - *Important Changes:*
    - provider_id is *no longer required* (system auto-picks providers)
    - latitude and longitude are *now required* (user's current location)
  - *What happens:*
    1. System finds all nearby providers within 10km radius who offer the selected service
    2. Creates booking with status pending_notification
    3. Sends notifications to all found providers
    4. Stores user's location in booking record
  - Response: { "booking": { "status": "pending_notification", "user_latitude": 0.0, "user_longitude": 0.0, ... }, "notified_providers": 5, "message": "Booking created. Notifications sent to 5 service providers" }
  - If no providers found: Returns error { "error": { "code": "no_providers", "message": "No service providers available in your area" } }
- *GET* https://aafa.mycartly.in/api/user/appointments/ongoing (user)
  - Query params: user_id (required)
  - Response: { "bookings": [ ... ] }
  - Includes bookings with status:
    - pending_notification - Waiting for provider to accept/reject
    - accepted - Provider accepted, service not yet started
    - in_progress - Service in progress
    - awaiting_payment - Service completed, waiting for payment
  - Shows all active bookings including those waiting for provider response
- *GET* https://aafa.mycartly.in/api/user/appointments/history (user)
  - Response: { "bookings": [ ... ] }

### 5.3 Provider Notifications (Rapido Model)

When a booking is created, all nearby providers receive notifications. The first provider to accept gets the booking.

- *GET* https://aafa.mycartly.in/api/provider/booking/notifications (provider)
  - Query params: provider_id (required), status (optional, default: "sent")
    - status values: "sent" (pending), "accepted", "rejected"
  - Response: { "notifications": [ { "booking_id": 1, "status": "sent", "notification_sent_at": "", "full_name": "", "address": "", "preferred_date": "", "preferred_time": "", "user_latitude": 0.0, "user_longitude": 0.0, ... } ], "count": 3, "status": "sent" }
  - *Frontend Implementation:*
    - Poll this endpoint periodically (e.g., every 5-10 seconds)
    - Compare with previous results to detect new notifications
    - When new notifications arrive, *play sound/tune* to alert the provider
    - Show notification count badge
  - Returns all booking notifications for the provider, including user location for distance calculation

- *POST* https://aafa.mycartly.in/api/provider/booking/notification/respond (provider)
  - Body: { "booking_id": 1, "provider_id": 1, "action": "accept" | "reject" }
  - *When Provider Accepts:*
    - Booking status changes to accepted
    - All other providers' notifications are automatically set to rejected
    - User is notified that provider accepted
    - Response: { "message": "Booking accepted successfully", "status": "accepted", "booking_id": 1 }
  - *When Provider Rejects:*
    - Notification status changes to rejected
    - Other providers still receive notifications (if they haven't responded yet)
    - System checks if all providers have rejected
    - If all reject → booking is automatically cancelled with status cancelled
    - Response: { "message": "Booking rejected. Notification will continue to other providers.", "status": "rejected", "booking_cancelled": false }
    - Or if all rejected: { "message": "Booking rejected. All providers have declined.", "status": "rejected", "booking_cancelled": true }

- *PUT* https://aafa.mycartly.in/api/provider/booking/accept/<booking_id> (provider; verified)
  - Query params: provider_id (required for Rapido model bookings)
  - Response: { "message": "Booking accepted", "status": "accepted" }
  - For Rapido model: automatically rejects other providers. For legacy bookings: direct acceptance.

- *POST* https://aafa.mycartly.in/api/provider/appointment/cancel/<booking_id> (provider)
  - Query params: provider_id (required for Rapido model)
  - Body: { "reason": "" }
  - Response (Rapido - not yet accepted): { "message": "Booking declined. Notification will continue to other providers.", "status": "rejected", "all_providers_cancelled": false }
  - Response (Rapido - all cancelled): { "message": "Booking cancelled. All providers have declined.", "status": "cancelled", "all_providers_cancelled": true }
  - Response (legacy): { "message": "Booking cancelled", "status": "cancelled" }
### 5.4 Provider Location Management

Providers must set their location to appear on the map and receive bookings.

- *POST* https://aafa.mycartly.in/api/provider/location/set (provider)
  - Body: { "provider_id": 1, "latitude": 0.0, "longitude": 0.0, "is_online": 1 }
  - Response: { "message": "Provider location updated", "provider_id": 1, "latitude": 0.0, "longitude": 0.0, "is_online": true }
  - *Purpose:*
    - Updates provider's current location (shown on map to users)
    - Set is_online = 1 when provider is available to receive bookings
    - Set is_online = 0 when provider goes offline (won't receive new bookings)
  - *When to call:*
    - During provider registration (optional, can be set later)
    - When provider starts their shift (set is_online = 1)
    - When provider moves to a new location
    - When provider ends their shift (set is_online = 0)
  - Only providers with is_online = 1 and valid coordinates appear in nearby providers search

### 5.5 Real-Time Location Tracking (After Acceptance)

Once a provider accepts a booking, both parties can track each other's locations in real-time.

- *POST* https://aafa.mycartly.in/api/provider/location/update (provider; accepted booking)
  - Body: { "booking_id": 1, "latitude": 0.0, "longitude": 0.0 }
  - Response: { "message": "Location updated", "snapped_location": { "latitude": 0.0, "longitude": 0.0, "place_id": "..." }, "eta": { "distance_meters": 1500, "duration_seconds": 300, ... } }
  - *Purpose:* Updates provider's location during active booking (for user to track provider)
  - Coordinates are automatically snapped to nearest road using Google Roads API
  - Returns ETA to destination if available
  - Call this periodically (e.g., every 10-30 seconds) while en route to user

- *POST* https://aafa.mycartly.in/api/user/location/update (user; accepted booking)
  - Body: { "booking_id": 1, "latitude": 0.0, "longitude": 0.0 }
  - Response: { "message": "User location updated", "booking_id": 1, "latitude": 0.0, "longitude": 0.0 }
  - *Purpose:* Updates user's location during active booking (for provider to track user)
  - Useful if user moves or provider needs to find user at a different location
  - Call this when user location changes significantly

- *GET* https://aafa.mycartly.in/api/booking/track/<booking_id> (user/provider)
  - Response: { "booking_id": 1, "status": "accepted", "provider_location": { "latitude": 0.0, "longitude": 0.0, "updated_at": "2025-01-20T10:30:00Z" }, "user_location": { "latitude": 0.0, "longitude": 0.0, "updated_at": "2025-01-20T10:25:00Z" } }
  - *Purpose:* Returns both user and provider locations for mutual tracking
  - Use this endpoint to display both parties on a map
  - Poll this endpoint periodically (e.g., every 5-10 seconds) to update map markers
  - If location not yet updated, returns initial booking location for user

- *GET* https://aafa.mycartly.in/api/user/track/<booking_id> (user)
  - Response: { "booking_id": "", "latitude": 0.0, "longitude": 0.0, "updated_at": "" }
  - Legacy endpoint: returns only provider location

- *GET* https://aafa.mycartly.in/api/admin/track/<booking_id> (admin)
  - Response: same as user track plus provider metadata.

- *PUT* https://aafa.mycartly.in/api/provider/location/stop/<booking_id> (provider)
  - Response: { "message": "Tracking stopped", "final_coordinates": { ... } }

## 6. Payment & Completion
- *POST* https://aafa.mycartly.in/api/payment/request (provider)
  - Body: { "booking_id": 0, "provider_id": 0, "user_id": 0, "amount": "0.00", "service_name": "", "user_phone": "" }
  - Response: { "message": "Payment link sent", "payment_link": "", "razorpay_order_id": "" }
- *POST* https://aafa.mycartly.in/api/payment/webhook (razorpay callback)
  - Body: Razorpay payload
  - Response: { "received": true }
- *POST* https://aafa.mycartly.in/api/booking/complete/<booking_id> (provider)
  - Body: { "otp": "123456" }
  - Response: { "message": "Booking completed", "status": "completed" }

## 7. Reviews & Ratings
- *POST* https://aafa.mycartly.in/api/user/review (user)
  - Body: { "appointment_id": 0, "provider_id": 0, "rating": 4.5, "comment": "" }
  - Response: { "review": { ... } }
- *GET* https://aafa.mycartly.in/api/provider/<provider_id>/reviews (public)
  - Response: { "reviews": [ ... ], "average_rating": 4.7 }
- *POST* https://aafa.mycartly.in/api/user/app-rating (user)
  - Body: { "rating": 5, "feedback": "" }
  - Response: { "message": "Thanks for your feedback" }

## 8. Ticketing & Messaging
- *POST* https://aafa.mycartly.in/api/user/ticket (user)
  - Body: { "user_id": 0, "order_id": 0, "title": "", "message": "" }
  - Response: { "ticket": { "status": "ongoing", ... } }
- *POST* https://aafa.mycartly.in/api/ticket/message (user/provider/admin aligned with ticket)
  - Body: { "ticket_id": 0, "sender_id": 0, "message": "" }
  - Response: { "message": "Message posted" }
- *PUT* https://aafa.mycartly.in/api/admin/ticket/<ticket_id>/close (admin)
  - Response: { "message": "Ticket closed", "status": "closed" }
- *GET* https://aafa.mycartly.in/api/user/messages (user)
  - Response: { "messages": [ ... ] }

## 9. Admin Operations
- *GET* https://aafa.mycartly.in/api/admin/users (admin)
- *GET* https://aafa.mycartly.in/api/admin/providers (admin)
  - Query (optional): provider_id, status, list=pending|approved.
    - Use list=pending to pull all providers at verification_in_progress.
    - Use list=approved to pull approved and suspended providers; supports manual status filter for any status.
  - Response:
    json
    {
      "data": [
        {
          "id": 42,
          "full_name": "Jane Doe",
          "phone_number": "+91857...",
          "email": "jane@example.com",
          "gender": "female",
          "address": "123 Main St",
          "city": "Jaipur",
          "state": "Rajasthan",
          "status": "approved",
          "verification_notes": "All KYC docs validated",
          "documents": {
            "profile_photo_url": "httpss://backendpetify.../provider_docs/profile_photos/...",
            "aadhaar_doc_url": "httpss://backendpetify.../provider_docs/aadhaar/...",
            "pan_doc_url": "httpss://backendpetify.../provider_docs/pan/...",
            "degree_doc_url": "httpss://backendpetify.../provider_docs/degrees/...",
            "previous_work_images": [
              "httpss://backendpetify.../provider_docs/work/1.png",
              "httpss://backendpetify.../provider_docs/work/2.png"
            ]
          },
          "bank_details": {
            "account_holder_name": "Jane Doe",
            "bank_name": "HDFC",
            "account_number": "50100123456789",
            "ifsc_code": "HDFC0001234"
          },
          "categories": [3, 4],
          "subcategories": [
            { "subcategory_id": 11, "category_id": 3 },
            { "subcategory_id": 12, "category_id": 4 }
          ],
          "is_suspended": false,
          "created_at": "2024-11-01T12:00:00Z",
          "updated_at": "2024-11-01T12:30:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 1,
        "total": 1
      }
    }
    
    This endpoint serves as the “single-provider” inspection API: supply provider_id=<id> to fetch the complete record, including uploaded documents and banking info.
- *GET* https://aafa.mycartly.in/api/admin/appointments (admin)
- *GET* https://aafa.mycartly.in/api/admin/reviews (admin)
- *GET* https://aafa.mycartly.in/api/admin/problems (admin)
- Responses: Paginated lists with filters, metadata { "data": [ ... ], "pagination": { ... } }

## 10. Automation Hooks
- *POST* https://aafa.mycartly.in/api/jobs/booking-auto-cancel (internal/scheduled; admin token)
  - Body: { "booking_id": 0 }
  - Response: { "message": "Booking auto-cancelled" }
- *POST* https://aafa.mycartly.in/api/jobs/location-heartbeat (internal/scheduled)
  - Body: { "booking_id": 0, "latitude": 0.0, "longitude": 0.0 }
  - Response: { "message": "Heartbeat recorded" }

## Error Model
- Error responses follow { "error": { "code": "", "message": "", "details": {} } }.
- Common codes: validation_error, authentication_failed, authorization_failed, not_found, conflict, internal_error.

## Rate Limiting & Security
- OTP endpoints: 5 per phone per hour.
- Booking and payment updates: audit trail with immutable history.
- All state-changing admin endpoints require MFA-protected tokens.