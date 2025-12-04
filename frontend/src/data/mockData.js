// src/data/mockData.js
export const stats = [
  { label: "Total Monthly Cost", value: "$75.96" },
  { label: "Active Subscriptions", value: "4" },
  { label: "Next Renewal", value: "Nov 10, 2025", subtext: "Spotify" },
];

// Expanded data to support 1M, 3M, 6M, 1Y, MAX filters
export const chartData = [
  { name: 'Jan 24', cost: 45 },
  { name: 'Feb 24', cost: 45 },
  { name: 'Mar 24', cost: 50 },
  { name: 'Apr 24', cost: 50 },
  { name: 'May 24', cost: 55 },
  { name: 'Jun 24', cost: 55 },
  { name: 'Jul 24', cost: 60 },
  { name: 'Aug 24', cost: 60 },
  { name: 'Sep 24', cost: 65 },
  { name: 'Oct 24', cost: 60 },
  { name: 'Nov 24', cost: 75 },
  { name: 'Dec 24', cost: 80 },
  { name: 'Jan 25', cost: 70 },
  { name: 'Feb 25', cost: 65 },
  { name: 'Mar 25', cost: 76 },
];

export const subscriptions = [
  {
    id: 1,
    name: "Netflix",
    status: "Active",
    frequency: "Monthly",
    renewalDate: "Dec 15, 2025",
    cost: "$18.99",
    logo: "N"
  },
  {
    id: 2,
    name: "Spotify",
    status: "Renewing Soon",
    frequency: "Monthly",
    renewalDate: "Nov 10, 2025",
    cost: "$12.99",
    logo: "S"
  },
  {
    id: 3,
    name: "Adobe Creative Cloud",
    status: "Active",
    frequency: "Annual",
    renewalDate: "Mar 5, 2026",
    cost: "$29.99",
    logo: "A"
  },
  {
    id: 4,
    name: "Figma",
    status: "Active",
    frequency: "Monthly",
    renewalDate: "Jan 12, 2026",
    cost: "$15.00",
    logo: "F"
  }
];