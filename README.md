# Vendor Management System

A comprehensive vendor management system built with React and Node.js that helps organizations manage their vendor relationships, document submissions, and approval workflows.

## Features

- **Vendor Management**: Add, edit, and manage vendor profiles
- **Document Management**: Upload, track, and approve vendor documents
- **Role-based Access Control**: Different permissions for vendors, consultants, and administrators
- **Dashboard Analytics**: Visualize vendor performance and document status
- **Workflow Automation**: Streamlined approval processes

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Project Structure

```
vendor-management-system/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── context/        # React context providers
│       ├── services/       # API services
│       └── utils/          # Helper functions
│
├── server/                 # Backend Express application
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── utils/              # Helper functions
│   └── server.js           # Server entry point
```

## User Roles

| Role        | Permissions                                                       |
|-------------|-------------------------------------------------------------------|
| Admin       | Full system access, manage users, generate reports                |
| Consultant  | Review and approve documents, manage assigned vendors             |
| Vendor      | Submit documents, view document status, update profile            |

## API Endpoints

The API provides the following endpoints:

- **Auth:** `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`
- **Users:** `/api/users`, `/api/users/:id`
- **Documents:** `/api/documents`, `/api/documents/:id`
- **Vendors:** `/api/users/analytics/vendors`
- **Consultants:** `/api/users/analytics/consultants`
- **Reports:** `/api/reports`
- **Notifications:** `/api/notifications`

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ivisBasavaraj/VendorTracker.git
cd VendorTracker
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
```

### Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client:
```bash
cd client
npm start
```

3. Access the application at http://localhost:3000

## Deployment

### Frontend
The React application can be deployed to Netlify, Vercel, or any static hosting service:

```bash
cd client
npm run build
```

### Backend
The Express API can be deployed to Heroku, Railway, or any Node.js hosting service.

## Screenshots

*Coming soon*

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT 