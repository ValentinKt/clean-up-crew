# Eco-Cleanup Crew

Eco-Cleanup Crew is a dynamic and collaborative web application designed to empower communities to organize and participate in environmental cleanup events. It provides a comprehensive, real-time suite of tools for users to create, discover, and manage local cleanups, fostering a sense of community and collective action towards a cleaner planet.

## Key Features

The application is built with a focus on user experience, collaboration, and intelligent assistance.

### 1. User Authentication & Profile Management

-   **Secure Sign-Up & Login:** A modern, user-friendly interface for registration and signing in, powered by Supabase Auth.
    -   **Email Verification:** New user registrations are secured with a mandatory email confirmation step.
    -   **Password Strength Indicator:** Real-time feedback helps users create strong, secure passwords.
    -   **Password Reset:** A secure "Forgot Password" flow allows users to reset their password via email.
    -   **Google OAuth:** Provides a one-click sign-in option using Google.
-   **Personalized User Profiles:**
    -   Each user has a profile page displaying their name, email, and avatar, stored securely in the Supabase database.
    -   Users can edit their own profile information.
    -   The profile provides a summarized view of all events they have organized and are attending.

### 2. Event Management

The core of the application revolves around creating, discovering, and participating in cleanup events.

#### 2.1. Event Discovery & Dashboard

-   **Personalized Event Feed:** The main dashboard is tailored to the logged-in user, displaying only the events they have organized or joined.
-   **Advanced Filtering:** Users can easily find relevant events using a powerful set of filters:
    -   Search by title or location.
    -   Filter by a specific date range.
    -   Filter by one or more event statuses (`Upcoming`, `In Progress`, `Completed`, `Cancelled`).
    -   Filter by distance with an intuitive range slider.
-   **Organized Layout:** The event list is intelligently separated into "Upcoming Events" and "Past & Active Events" for clarity.

#### 2.2. Event Creation

-   **Intuitive Creation Form:** A step-by-step form guides organizers through the process of creating a new event.
-   **Interactive Map Picker:** Organizers can search for a location or drag a pin on an interactive map to set the event's coordinates precisely.
-   **Draft Recovery:** Form progress is automatically saved to local storage. If a user navigates away, they can restore their unsaved draft upon returning.
-   **AI-Powered Assistance (Gemini):**
    -   **Generate Description:** Automatically generate an inspiring and engaging event description based on the event title.
    -   **Suggest Equipment:** Receive intelligent suggestions for what participants should bring based on the event's title and description.

#### 2.3. Detailed Event View

This is the central hub for event collaboration and information.

-   **Interactive Map View:** An embedded map displays the precise event location with a custom pin.
-   **Participant Management:**
    -   Users can easily join or leave upcoming events with a single click.
    -   A visual roster shows all participant avatars, with a summary count.
-   **Real-time Participant Chat:**
    -   Powered by Supabase Realtime, the chat allows participants to communicate and see messages appear instantly without refreshing.
-   **Collaborative Equipment Checklist:**
    -   Organizers can list necessary equipment.
    -   Participants can "claim" items, and updates are reflected live for everyone.
-   **Photo Gallery:** Organizers can upload photos of collected waste, which are automatically timestamped and displayed.
-   **Organizer Controls:**
    -   **Edit Event:** Organizers can modify all event details after creation.
    -   **Manage Status:** Organizers can update the event status, and the changes are broadcast in real-time.

### 3. Technical Architecture

-   **Backend-as-a-Service (BaaS):** The application is powered by **Supabase**, providing a robust and scalable backend.
    -   **PostgreSQL Database & RPC:** All data is stored in PostgreSQL. Complex operations (like creating or joining an event) are handled by **Supabase RPC (database functions)**, ensuring transactions are atomic, performant, and secure by executing logic on the server.
    -   **Realtime Subscriptions:** Supabase's real-time engine pushes live data changes to the client, enabling features like live chat and instant UI updates.
    -   **Authentication:** Secure user management and authentication is handled by Supabase Auth.
-   **Modular Services:** Data logic is cleanly separated into services (`eventService`, `userService`), making the codebase maintainable and scalable.
-   **AI Integration:** The **Google Gemini API** is used for natural language processing tasks, providing intelligent features for event creation.
-   **Modern Frontend Stack:**
    -   **React & TypeScript:** For building a type-safe, component-based user interface.
    -   **Tailwind CSS:** For rapid, utility-first styling.
    -   **Leaflet.js:** For interactive and customizable maps.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

-   A [Supabase](https://supabase.com/) account and project.
-   A [Google AI Studio](https://ai.google.dev/) account to obtain a Gemini API key.
-   Node.js and a package manager (e.g., npm).

### Setup

1.  **Clone the Repository**
    ```sh
    git clone <repository_url>
    cd eco-cleanup-crew
    ```

2.  **Install Dependencies**
    ```sh
    npm install
    ```

3.  **Set Up Supabase**
    -   In your Supabase project dashboard, go to the **SQL Editor**.
    -   Copy the entire content of `services/database.sql` and run it to create the necessary tables, policies, and RPC functions.

4.  **Environment Variables**
    -   Create a `.env` file in the root of your project (or configure them in your hosting provider's dashboard).
    -   Add your Supabase and Gemini API credentials:
        ```
        # Your Gemini API Key from Google AI Studio
        API_KEY="YOUR_GEMINI_API_KEY"

        # Your Supabase Project URL
        SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"

        # Your Supabase Project Public Anon Key
        SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        ```

5.  **Run the Application**
    -   This project is set up for a specific development environment. To run it locally, you would typically use a development server like Vite:
    ```sh
    # (Assuming a 'dev' script is added to package.json)
    npm run dev
    ```
# clean-up-crew
