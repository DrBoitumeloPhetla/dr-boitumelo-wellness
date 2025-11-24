// Demo data generator for admin dashboard testing
export const generateDemoData = () => {
  // Sample orders
  const demoOrders = [
    {
      id: 'ORD-1698234001',
      customer: {
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '+27 81 234 5678',
        address: '123 Main Street',
        city: 'Johannesburg',
        postalCode: '2001',
        notes: 'Please deliver between 9am-5pm'
      },
      items: [
        { id: '1', name: 'Vitamin D3 Capsules', price: 299.99, quantity: 2 },
        { id: '2', name: 'Omega-3 Fish Oil', price: 399.99, quantity: 1 }
      ],
      total: 999.97,
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 'ORD-1698234002',
      customer: {
        name: 'Michael Smith',
        email: 'msmith@email.com',
        phone: '+27 82 345 6789',
        address: '456 Oak Avenue',
        city: 'Pretoria',
        postalCode: '0001',
        notes: ''
      },
      items: [
        { id: '10', name: 'Complete Wellness Package', price: 2499.99, quantity: 1 }
      ],
      total: 2499.99,
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'processing'
    },
    {
      id: 'ORD-1698234003',
      customer: {
        name: 'Thandiwe Nkosi',
        email: 'tnkosi@email.com',
        phone: '+27 83 456 7890',
        address: '789 Rose Road',
        city: 'Cape Town',
        postalCode: '8001',
        notes: 'Gift wrap please'
      },
      items: [
        { id: '3', name: 'Probiotic Complex', price: 449.99, quantity: 1 },
        { id: '4', name: 'Magnesium Glycinate', price: 349.99, quantity: 1 },
        { id: '5', name: 'B-Complex Vitamins', price: 279.99, quantity: 2 }
      ],
      total: 1359.96,
      orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    }
  ];

  // Sample appointments
  const demoAppointments = [
    {
      id: 'APT-1698234101',
      type: 'virtual',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      time: '10:00',
      name: 'Emma Williams',
      email: 'emma.w@email.com',
      phone: '+27 84 567 8901',
      symptoms: 'Fatigue and low energy levels for the past 3 months',
      symptomsStartDate: '3 months ago',
      vitaminDTest: 'yes',
      additionalNotes: 'Recent blood work available',
      bookedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 'APT-1698234102',
      type: 'telephonic',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      time: '14:30',
      name: 'David Chen',
      email: 'd.chen@email.com',
      phone: '+27 85 678 9012',
      symptoms: 'Joint pain and inflammation',
      symptomsStartDate: '2 weeks ago',
      vitaminDTest: 'no',
      additionalNotes: 'Interested in natural anti-inflammatory options',
      bookedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed'
    },
    {
      id: 'APT-1698234103',
      type: 'virtual',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      time: '11:00',
      name: 'Lerato Mokwena',
      email: 'lerato.m@email.com',
      phone: '+27 86 789 0123',
      symptoms: 'Sleep issues and anxiety',
      symptomsStartDate: '1 month ago',
      vitaminDTest: 'unsure',
      additionalNotes: 'Looking for holistic approach to wellness',
      bookedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 'APT-1698234104',
      type: 'telephonic',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      time: '09:00',
      name: 'John Petersen',
      email: 'j.petersen@email.com',
      phone: '+27 87 890 1234',
      symptoms: 'Digestive issues',
      symptomsStartDate: '6 months ago',
      vitaminDTest: 'yes',
      additionalNotes: '',
      bookedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed'
    }
  ];

  // Sample contact submissions
  const demoContacts = [
    {
      id: 'CON-1698234201',
      name: 'Precious Dlamini',
      email: 'p.dlamini@email.com',
      phone: '+27 71 234 5678',
      serviceType: 'nutritional-counseling',
      message: 'Hi, I\'m interested in learning more about your nutritional counseling services. I have specific dietary restrictions and would like personalized guidance.',
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'new'
    },
    {
      id: 'CON-1698234202',
      name: 'Robert van der Merwe',
      email: 'r.vandermerwe@email.com',
      phone: '+27 72 345 6789',
      serviceType: 'health-education',
      message: 'Do you offer group workshops on vitamin D and its benefits? Our company is interested in organizing a wellness seminar for employees.',
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'read'
    },
    {
      id: 'CON-1698234203',
      name: 'Nomsa Zulu',
      email: 'nomsa.z@email.com',
      phone: '+27 73 456 7890',
      serviceType: 'supplement-consultation',
      message: 'I would like to book a consultation to discuss which supplements would be best for my health goals. I am particularly interested in immune system support.',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'responded'
    },
    {
      id: 'CON-1698234204',
      name: 'Andrew Mitchell',
      email: 'a.mitchell@email.com',
      phone: '+27 74 567 8901',
      serviceType: 'general-inquiry',
      message: 'What are your clinic hours and location? Also, do you accept medical aid?',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'new'
    }
  ];

  // Save to localStorage
  localStorage.setItem('adminOrders', JSON.stringify(demoOrders));
  localStorage.setItem('adminAppointments', JSON.stringify(demoAppointments));
  localStorage.setItem('adminContacts', JSON.stringify(demoContacts));

  console.log('✅ Demo data generated successfully!');
  console.log(`- ${demoOrders.length} orders`);
  console.log(`- ${demoAppointments.length} appointments`);
  console.log(`- ${demoContacts.length} contact submissions`);
};

// Function to clear all demo data
export const clearDemoData = () => {
  localStorage.removeItem('adminOrders');
  localStorage.removeItem('adminAppointments');
  localStorage.removeItem('adminContacts');
  console.log('🗑️ Demo data cleared');
};
