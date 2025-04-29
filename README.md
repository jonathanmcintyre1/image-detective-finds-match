
# CopyProtect - Image Matching Solution

CopyProtect is a web application that helps users discover unauthorized copies of their images across the web. This document provides a comprehensive overview of the application's architecture, its functionality, and how each component interacts.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Features](#core-features)
- [Database Schema](#database-schema)
- [Application Structure](#application-structure)
  - [React Components](#react-components)
  - [Services](#services)
  - [Hooks](#hooks)
  - [Types](#types)
  - [Utilities](#utilities)
- [How It Works](#how-it-works)
- [Data Flow](#data-flow)
- [Getting Started](#getting-started)

## Architecture Overview

CopyProtect is built as a modern React application with TypeScript, utilizing a clean and modular component-based architecture:

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn-ui components
- **State Management**: React hooks for local state
- **API Integration**: Google Cloud Vision API for image analysis
- **Database**: Supabase for data persistence
- **Routing**: React Router for page navigation
- **Data Visualization**: Recharts for analytics data display

The application follows a component-oriented architecture where the UI is broken down into small, reusable components. State management is primarily handled through React hooks, and data is fetched through service modules that encapsulate the API logic.

## Core Features

1. **Image Upload & Analysis**: Users can upload images or provide URLs, and the application analyzes them using Google Cloud Vision API.
2. **Match Detection**: The system identifies exact and partial matches of the uploaded images across the web.
3. **Results Dashboard**: A comprehensive dashboard that displays match statistics and visualizations.
4. **Match Filtering**: Users can filter results based on confidence level, type, and other criteria.
5. **Results Export**: Export findings to formats like CSV for further analysis.
6. **Analytics Tracking**: Search activities are tracked to provide insights on usage patterns.

## Database Schema

The application interacts with Supabase database through two main tables:

### 1. searches
- `id`: UUID primary key
- `image_hash`: Text field storing image identifier
- `result_count`: Integer storing number of results found
- `created_at`: Timestamp of when the search was conducted

### 2. prelaunch_signups
- `id`: UUID primary key
- `email`: Text field for user email
- `name`: Text field for user name
- `company`: Text field for user company
- `created_at`: Timestamp of when the signup was created
- Additional metadata fields for analytics

## Application Structure

### React Components

#### Page Components
- `Index.tsx`: Main entry point and landing page
- `NotFound.tsx`: 404 error page

#### UI Components
- `Header.tsx`: Navigation header with logo and links
- `ImageUploader.tsx`: Component for uploading images
- `ResultsDashboard.tsx`: Dashboard displaying analysis results
- `ResultsDisplay.tsx`: Component for displaying match results
- `FilterControls.tsx`: UI for filtering search results
- `ExactMatchesTable.tsx`: Table of exact image matches
- `PagesMatchTable.tsx`: Table of web pages with image matches
- `ResultsGrid.tsx`: Grid view of image matches
- `StatCard.tsx`: Individual stat card for dashboard metrics
- `StatCardGrid.tsx`: Grid layout for multiple stat cards
- `MatchDistributionCard.tsx`: Card showing match type distribution
- `TopDomainsCard.tsx`: Card showing top domains with matches

#### Page-Specific Components
- `ApiKeyReminder.tsx`: Reminder for setting Google API key
- `BetaSignupCard.tsx`: Card for beta program registration
- `BetaSignupDialog.tsx`: Dialog for beta signup details
- `HowItWorksCard.tsx`: Card explaining application functionality
- `ImagePreview.tsx`: Image preview component
- `PageHeader.tsx`: Header section of the index page
- `PageFooter.tsx`: Footer section of the index page
- `ResultsArea.tsx`: Area displaying search results
- `UploadCard.tsx`: Card for the image upload function

### Services

- `googleVisionService.ts`: Integration with Google Cloud Vision API
- `searchTrackingService.ts`: Service for tracking search activity in the database

### Hooks

- `use-mobile.tsx`: Responsive design hook for mobile detection
- `useBetaSignupPrompt.tsx`: Hook for managing beta signup prompts
- `useItemTracking.ts`: Hook for tracking reviewed or saved items
- `useResultsExport.ts`: Hook for exporting results data
- `useResultsFiltering.ts`: Hook for filtering search results
- `useSearchAnalytics.ts`: Hook for retrieving search analytics data

### Types

- `results.ts`: TypeScript interfaces for match results and related data

### Utilities

- `domainUtils.ts`: Utility functions for domain name processing and categorization

## How It Works

1. **Image Selection**: User uploads an image file or provides an image URL
2. **API Initialization**: System checks for a valid Google Cloud Vision API key
3. **Image Analysis**: The application sends the image to Google Cloud Vision API
4. **Result Processing**: The API response is processed to identify:
   - Exact image matches
   - Partial image matches
   - Web pages containing the image
   - Domain categorization
5. **Result Visualization**: Results are displayed in the dashboard with filtering options
6. **Data Persistence**: Search actions are logged in the Supabase database
7. **Analytics**: Usage data is collected for analysis

## Data Flow

```
User Input → Image Processing → API Request → Result Processing → 
Data Display → Database Logging → Analytics
```

1. **User Input Layer**: Components like `ImageUploader.tsx` and `UploadCard.tsx`
2. **Processing Layer**: Services like `googleVisionService.ts`
3. **State Management**: Hooks like `useResultsFiltering.ts`
4. **Visualization Layer**: Components like `ResultsDashboard.tsx` and `ResultsDisplay.tsx`
5. **Persistence Layer**: `searchTrackingService.ts` interacting with Supabase

## Getting Started

### Prerequisites

- Node.js & npm installed
- Google Cloud Vision API key

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

### Configuration

1. Set up your Google Cloud Vision API key in the application
2. The application will automatically connect to the configured Supabase instance

### Deployment

Your application can be easily deployed through Lovable by clicking on Share → Publish.

---

This architecture overview provides a high-level understanding of how CopyProtect works. For more detailed information, refer to the specific component files and their documentation.
