// navigationTypes.ts

export type RootStackParamList = {
    Login: undefined; // Login screen has no parameters
    Signup: undefined; // Signup screen has no parameters
    Customer: { user: any};
    Technician: { user: any};
    Admin: { user: any};
    AdminCreateTechnician: { user: any}; 
    AdminCreation: { user: any}; 
    CreateAppointment: { user: any}; 
  };
  