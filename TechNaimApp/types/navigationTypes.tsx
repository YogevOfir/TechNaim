// navigationTypes.ts

export type RootStackParamList = {
    Login: undefined; // Login screen has no parameters
    Signup: undefined; // Signup screen has no parameters
    Customer: { user: any}; // Customer screen has no parameters
    Technician: { user: any}; // Technician screen has no parameters
    Admin: { user: any}; // Admin screen has no parameters
    AdminCreateTechnician: { user: any}; // AdminCreateTechnician has no parameters
    AdminCreation: { user: any}; // AdminCreation has no parameters
  };
  