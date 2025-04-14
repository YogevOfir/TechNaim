# TechNaim

TechNaim is a full-stack application that connects customers, technicians, and administrators to manage appointments and location sharing seamlessly. Designed for the market, TechNaim helps technicians share their real-time location during in-progress appointments, allowing customers to view their technician’s location on a map, and see a real-time and updated schedule.

## Overview

TechNaim integrates a Node.js/Express backend with a React Native frontend. It features real-time updates via Socket.IO and dynamic schedule recalculations when appointments are in progress. The application supports role-specific dashboards:

- **Administrators:** Manage technicians, and appointments, and review overall system status.
- **Technicians:** View daily appointments, update and share real-time location and arriving time often during in-progress appointments, and automatically recalculate schedules based on google-maps.
- **Customers:** Receive real-time location updates on a map when they have an in-progress appointment and can see estimated technician arrival times based on traffic in google-maps.

## Features

- **Real-Time Location Sharing:**  
  - Technicians often share their location and estimated arrival time during in-progress appointments with the customers.
  - The system builds him schedule based on customers' locations and the fastest route between them.
  - Customers see an interactive map displaying their technicians’ current locations and have estimated arrival times of the technicians.
  
- **Dynamic Schedule Recalculation:**  
  - Schedules are recalculated based on the technician’s current location if the appointment is today.
  - For future appointments, the schedule recalculation uses the technician’s address and a fixed start time of 8:00 AM (Start of Work).
  - The system builds a route to the technician between the customers based on location to make the smallest route.
  
- **Socket.IO Rooms:**  
  - Each technician with an in-progress appointment gets a dedicated room.
  - Customers join these rooms only if they have an active appointment with the technician.
  - The system manages room membership automatically based on appointment status.
  
- **Role-Specific Dashboards:**  
  - **Administrator:** A comprehensive dashboard for managing Technicians and appointments.
  - **Technician:** A dashboard to view today's appointments, update location, finish tasks, and calendar for the next days.
  - **Customer:** A screen to view appointment details and a live map that shows the technicians' locations.

## Logo

<p align="center">
  <img src="./TechNaimApp/assets/logo.png" alt="TechNaim Logo" width="350px" />
</p>

## Screenshots

<!-- First Row: Technician Dashboard and Customer Map View -->
<p align="center">
  <table>
    <tr>
      <td align="center"><strong>Technician Dashboard</strong></td>
      <td align="center"><strong>Customer Map View</strong></td>
    </tr>
    <tr>
      <td align="center">
        <img src="./TechNaimApp/assets/TechNaim_Technician.png"
             alt="Technician Dashboard"
             width="250px"
             style="margin: 10px;" />
      </td>
      <td align="center">
        <img src="./TechNaimApp/assets/TechNaim_Customer.png"
             alt="Customer Map View"
             width="250px"
             style="margin: 10px;" />
      </td>
    </tr>
  </table>
</p>

<!-- Second Row: Administrator Dashboard and Create Appointment Screen -->
<p align="center">
  <table>
    <tr>
      <td align="center"><strong>Administrator Dashboard</strong></td>
      <td align="center"><strong>Create Appointment Screen</strong></td>
    </tr>
    <tr>
      <td align="center">
        <img src="./TechNaimApp/assets/TechNaim_Admin.png"
             alt="Administrator Dashboard"
             width="250px"
             style="margin: 10px;" />
      </td>
      <td align="center">
        <img src="./TechNaimApp/assets/TechNaim_CreateAppointment.png"
             alt="Create Appointment Screen"
             width="250px"
             style="margin: 10px;" />
      </td>
    </tr>
  </table>
</p>


## Contributing

Contributions to TechNaim are welcome! If you have improvements or bug fixes to share, please:

1. Fork the repository.
2. Create a new branch for your feature or fix (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to your fork and submit a Pull Request.


---
