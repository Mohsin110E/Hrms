import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await seedParameterTypesAndParameters();
  await seedMessages();
  await seedSystemConfigurations();
  await seedUserTypes();
  await seedRoles();
  await seedDocumentTypes();
  await seedMenuItems();
}

async function seedParameterTypesAndParameters() {
  // Extracted from planning/discovery/system_parameters.csv
  const groups: Record<number, { name: string; parameters: Array<{ id: number; text: string; value: number; order: number; visible: boolean; code?: string }> }> = {
    1: { name: 'User Type', parameters: [
      { id: 2, text: 'Internal', value: 1, order: 1, visible: true, code: 'internal' },
      { id: 3, text: 'External', value: 2, order: 2, visible: true, code: 'external' },
    ]},
    2: { name: 'User Status', parameters: [
      { id: 4, text: 'Active', value: 1, order: 1, visible: true, code: 'active' },
      { id: 5, text: 'Inactive', value: 2, order: 2, visible: true, code: 'inactive' },
    ]},
    3: { name: 'Log Type', parameters: [
      { id: 6, text: 'Login', value: 1, order: 1, visible: true, code: 'login' },
    ]},
    4: { name: 'Message Type', parameters: [
      { id: 7, text: 'Error', value: 1, order: 1, visible: true, code: 'error' },
      { id: 8, text: 'Warning', value: 2, order: 2, visible: true, code: 'warning' },
      { id: 9, text: 'Success', value: 3, order: 3, visible: true, code: 'success' },
    ]},
    5: { name: 'Data Type', parameters: [
      { id: 99, text: 'int', value: 1, order: 1, visible: true },
      { id: 100, text: 'range', value: 2, order: 2, visible: true },
      { id: 101, text: 'multiselect', value: 3, order: 3, visible: true },
      { id: 102, text: 'singleselect', value: 4, order: 4, visible: true },
      { id: 103, text: 'string', value: 5, order: 5, visible: true },
      { id: 173, text: 'Year', value: 6, order: 6, visible: true },
      { id: 174, text: 'Month', value: 7, order: 7, visible: true },
    ]},
    6: { name: 'Field Data Type', parameters: [
      { id: 14, text: 'string', value: 1, order: 1, visible: true },
      { id: 15, text: 'password', value: 2, order: 2, visible: true },
      { id: 16, text: 'bit', value: 3, order: 3, visible: true },
      { id: 17, text: 'date', value: 4, order: 4, visible: true },
      { id: 19, text: 'byte', value: 5, order: 5, visible: true },
      { id: 20, text: 'int', value: 6, order: 6, visible: true },
      { id: 23, text: 'upload', value: 7, order: 7, visible: true },
      { id: 26, text: 'singleselect', value: 8, order: 8, visible: true },
      { id: 30, text: 'multiselect', value: 9, order: 9, visible: true },
      { id: 31, text: 'Text', value: 10, order: 10, visible: true },
    ]},
    8: { name: 'Passport Type', parameters: [
      { id: 27, text: 'Regular', value: 1, order: 1, visible: true },
      { id: 28, text: 'Emergency', value: 2, order: 2, visible: false },
      { id: 29, text: 'Diplomatic', value: 3, order: 3, visible: false },
    ]},
    9: { name: 'Marital Status', parameters: [
      { id: 24, text: 'Single', value: 1, order: 1, visible: true },
      { id: 25, text: 'Married', value: 2, order: 2, visible: true },
    ]},
    10: { name: 'Gender', parameters: [
      { id: 33, text: 'Female', value: 1, order: 1, visible: true },
      { id: 34, text: 'Male', value: 2, order: 2, visible: true },
      { id: 35, text: 'Other', value: 3, order: 3, visible: true },
    ]},
    11: { name: 'BloodGroup', parameters: [
      { id: 37, text: 'A+', value: 1, order: 1, visible: true },
      { id: 38, text: 'A-', value: 2, order: 2, visible: true },
      { id: 39, text: 'B+', value: 3, order: 3, visible: true },
      { id: 40, text: 'B-', value: 4, order: 4, visible: true },
      { id: 42, text: 'O+', value: 5, order: 5, visible: true },
      { id: 43, text: 'O-', value: 6, order: 6, visible: true },
      { id: 44, text: 'AB+', value: 7, order: 7, visible: true },
      { id: 45, text: 'AB-', value: 8, order: 8, visible: true },
    ]},
    12: { name: 'Source of hire', parameters: [
      { id: 46, text: 'Direct', value: 1, order: 1, visible: true },
      { id: 47, text: 'Referral', value: 2, order: 2, visible: true },
      { id: 48, text: 'Web', value: 3, order: 3, visible: true },
      { id: 49, text: 'Newspaper', value: 4, order: 4, visible: true },
      { id: 50, text: 'Advertisement', value: 5, order: 5, visible: true },
    ]},
    13: { name: 'Location', parameters: [
      { id: 51, text: 'Dubai', value: 1, order: 1, visible: true },
      { id: 53, text: 'AbuDhabi', value: 2, order: 2, visible: true },
      { id: 192, text: 'Nepal', value: 3, order: 3, visible: true },
      { id: 191, text: 'India', value: 4, order: 4, visible: true },
    ]},
    14: { name: 'Employee Type', parameters: [
      { id: 55, text: 'Permanent', value: 1, order: 1, visible: true },
      { id: 57, text: 'On Contract', value: 2, order: 2, visible: true },
      { id: 58, text: 'Temporary', value: 3, order: 3, visible: true },
      { id: 59, text: 'Intern', value: 4, order: 4, visible: true },
    ]},
    15: { name: 'Dependant Relation', parameters: [
      { id: 62, text: 'Wife', value: 1, order: 1, visible: true },
      { id: 63, text: 'Son', value: 2, order: 2, visible: true },
      { id: 64, text: 'Daughter', value: 3, order: 3, visible: true },
      { id: 66, text: 'Parent', value: 4, order: 4, visible: true },
      { id: 129, text: 'Husband', value: 5, order: 5, visible: true },
    ]},
    17: { name: 'ExitReason', parameters: [
      { id: 69, text: 'Terminated', value: 1, order: 1, visible: true },
      { id: 70, text: 'Resigned', value: 2, order: 2, visible: true },
      { id: 71, text: 'Absconded', value: 3, order: 3, visible: true },
      { id: 98, text: 'Other', value: 4, order: 4, visible: false },
    ]},
    18: { name: 'Date Range', parameters: [
      { id: 73, text: '7 Days', value: 7, order: 1, visible: true },
      { id: 74, text: '14 days', value: 14, order: 2, visible: true },
      { id: 75, text: '30 Days', value: 30, order: 3, visible: true },
      { id: 76, text: '60 Days', value: 60, order: 4, visible: true },
      { id: 137, text: '90 Days', value: 90, order: 5, visible: true },
      { id: 138, text: 'More than 90 Days', value: 91, order: 6, visible: true },
    ]},
    19: { name: 'Nationality', parameters: [
      { id: 200, text: 'Indian', value: 1, order: 1, visible: true },
      { id: 201, text: 'Pakistani', value: 2, order: 2, visible: true },
      { id: 202, text: 'Filipino', value: 3, order: 3, visible: true },
      { id: 203, text: 'Emirati', value: 4, order: 4, visible: true },
      { id: 204, text: 'Other', value: 5, order: 5, visible: true },
    ]},
    20: { name: 'Employee Status', parameters: [
      { id: 210, text: 'Active', value: 1, order: 1, visible: true },
      { id: 211, text: 'On Leave', value: 2, order: 2, visible: true },
      { id: 212, text: 'Suspended', value: 3, order: 3, visible: true },
      { id: 213, text: 'Terminated', value: 4, order: 4, visible: true },
    ]},
    21: { name: 'Contract Type', parameters: [
      { id: 220, text: 'Full Time', value: 1, order: 1, visible: true },
      { id: 221, text: 'Part Time', value: 2, order: 2, visible: true },
      { id: 222, text: 'Contract', value: 3, order: 3, visible: true },
      { id: 223, text: 'Internship', value: 4, order: 4, visible: true },
    ]},
    22: { name: 'Visa Type', parameters: [
      { id: 230, text: 'Employment', value: 1, order: 1, visible: true },
      { id: 231, text: 'Residence', value: 2, order: 2, visible: true },
      { id: 232, text: 'Visit', value: 3, order: 3, visible: true },
      { id: 233, text: 'Tourist', value: 4, order: 4, visible: true },
    ]},
  };

  for (const [typeId, group] of Object.entries(groups)) {
    await prisma.parameterType.upsert({
      where: { id: Number(typeId) },
      create: { id: Number(typeId), name: group.name },
      update: { name: group.name },
    });

    for (const p of group.parameters) {
      await prisma.parameter.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          parameterTypeId: Number(typeId),
          text: p.text,
          parameterValue: p.value,
          displayOrder: p.order,
          isVisible: p.visible,
          code: p.code ?? null,
        },
        update: {
          text: p.text,
          parameterValue: p.value,
          displayOrder: p.order,
          isVisible: p.visible,
          code: p.code ?? null,
        },
      });
    }
  }
}

async function seedMessages() {
  const messages: Array<{ id: number; code: string; text: string; shortDesc: string; messageTypeId: number; order: number }> = [
    { id: 2, code: 'INVALID_CREDENTIALS', text: 'Incorrect username and/or password. Please try again or click on Forgot Password to create a new password', shortDesc: 'Invalid Login', messageTypeId: 7, order: 1 },
    { id: 4, code: 'OK', text: 'Data retrieved successfully', shortDesc: 'Success Message', messageTypeId: 9, order: 2 },
    { id: 5, code: 'UPDATED', text: 'Data Updated Successfully', shortDesc: 'Records Update successfully', messageTypeId: 9, order: 3 },
    { id: 6, code: 'EMAIL_EXISTS', text: 'EmailId already exists', shortDesc: 'User Setup', messageTypeId: 7, order: 4 },
    { id: 7, code: 'EMPLOYEE_CODE_EXISTS', text: 'Employee code already exists.', shortDesc: 'Employee code', messageTypeId: 7, order: 5 },
    { id: 8, code: 'EMAIL_SENT', text: 'Email send Succesfully', shortDesc: 'Email Send', messageTypeId: 9, order: 6 },
    { id: 9, code: 'FILE_DOWNLOADED', text: 'File downloaded Successfully', shortDesc: 'File Download', messageTypeId: 9, order: 7 },
    { id: 10, code: 'HOLIDAY_EXISTS', text: 'Holiday Detail Already Exist', shortDesc: 'Holiday Details', messageTypeId: 7, order: 8 },
    { id: 11, code: 'WEEKLY_OFF_EXISTS', text: 'WOF List Already Exist', shortDesc: 'WeekilyConfig', messageTypeId: 7, order: 9 },
    { id: 12, code: 'SITE_YEAR_EXISTS', text: 'Site Already Exist for this year', shortDesc: 'WeekilyConfig', messageTypeId: 7, order: 10 },
    { id: 19, code: 'FILE_UPLOADED', text: 'File upload successfully', shortDesc: 'File Upload', messageTypeId: 9, order: 11 },
    { id: 20, code: 'MANDATORY_FIELDS_MISSING', text: 'Mandatory fields are not present', shortDesc: 'File Upload', messageTypeId: 7, order: 12 },
    { id: 23, code: 'COLUMN_MISSING', text: 'Column is missing {{0}}', shortDesc: 'Column Missing', messageTypeId: 7, order: 13 },
    { id: 24, code: 'INVALID_DATA', text: 'Invalid data', shortDesc: 'Invalid data', messageTypeId: 7, order: 14 },
    { id: 25, code: 'MANDATORY_MISSING', text: 'Mandatory fields missing', shortDesc: 'Mandatory', messageTypeId: 7, order: 15 },
    { id: 28, code: 'SHIFT_EXISTS', text: 'Shift Name Already Exists', shortDesc: 'Shift Master', messageTypeId: 7, order: 16 },
    { id: 30, code: 'INCORRECT_PASSWORD', text: 'Incorrect password', shortDesc: 'Payroll', messageTypeId: 7, order: 17 },
  ];

  for (const m of messages) {
    await prisma.message.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        code: m.code,
        text: m.text,
        shortDesc: m.shortDesc,
        messageTypeId: m.messageTypeId,
        displayOrder: m.order,
      },
      update: {
        code: m.code,
        text: m.text,
        shortDesc: m.shortDesc,
        messageTypeId: m.messageTypeId,
        displayOrder: m.order,
      },
    });
  }
}

async function seedSystemConfigurations() {
  const configs: Array<{ id: number; name: string; value?: string; valueDate?: Date; valueKind: string; description?: string }> = [
    { id: 1, name: 'CompOff Leave Expiry', value: '90', valueKind: 'number', description: 'Days after which comp-off leave expires' },
    { id: 2, name: 'CompOff Request Expiry', value: '30', valueKind: 'number', description: 'Days after which comp-off request expires' },
    { id: 3, name: 'AnnualLeave Exception Months', value: '0', valueKind: 'number', description: 'Annual leave exception months' },
    { id: 4, name: 'CompOffAvail Exception days', value: '5,6,7', valueKind: 'string', description: 'Days on which comp-off can be availed' },
    { id: 5, name: 'WeekOffdays for Operation', value: '1', valueKind: 'number', description: 'Weekly off days for operations' },
    { id: 6, name: 'HalfDay Min work hours', value: '0', valueKind: 'number', description: 'Minimum work hours for half day' },
    { id: 7, name: 'Full Day Min work hours', value: '8', valueKind: 'number', description: 'Minimum work hours for full day' },
    { id: 8, name: 'Break Time In Min-Upload', value: '30', valueKind: 'number', description: 'Break time in minutes for upload' },
    { id: 9, name: 'Break Time In Min-ERP', value: '30', valueKind: 'number', description: 'Break time in minutes for ERP' },
    { id: 10, name: 'Attendance Sync Date', value: '1', valueKind: 'number', description: 'Attendance sync date' },
    { id: 11, name: 'PayrollMonth', value: '6', valueKind: 'number', description: 'Payroll month' },
    { id: 12, name: 'IsHrAdminAvailable', value: '1', valueKind: 'number', description: 'Is HR admin available' },
    // Config 13 (PayrollPassword) is a secret and is intentionally NOT seeded (SEC-L-19).
    { id: 14, name: 'OTRequired', value: '1', valueKind: 'number', description: 'OT required' },
    { id: 15, name: 'LeaveEncashment', value: '1', valueKind: 'number', description: 'Leave encashment enabled' },
    { id: 16, name: 'GratuityDate', value: '2000-01-01', valueKind: 'date', description: 'Gratuity date' },
    { id: 17, name: 'CompOffAvail Exception days Site1', value: '5,6', valueKind: 'string', description: 'Comp-off availing exception days for site 1' },
    { id: 18, name: 'CompOffAvail Exception days Site2', value: '6,7', valueKind: 'string', description: 'Comp-off availing exception days for site 2' },
    { id: 19, name: 'Family Airfare required', value: '1', valueKind: 'number', description: 'Family airfare required' },
    { id: 20, name: 'MaxNoOfFamilyMembers', value: '4', valueKind: 'number', description: 'Maximum number of family members' },
    { id: 21, name: 'Deduction Perccentage', value: '20', valueKind: 'number', description: 'Deduction percentage' },
    { id: 22, name: 'Full day work minutes', value: '480', valueKind: 'number', description: 'Full day work minutes' },
    { id: 23, name: 'Minimum days to apply sandwitch rule', value: '2', valueKind: 'number', description: 'Minimum days to apply sandwich rule' },
    { id: 24, name: 'RamadanDates', value: '2026-02-18', valueDate: new Date('2026-03-19'), valueKind: 'date', description: 'Ramadan end date' },
    { id: 25, name: 'Annual Leave Validation', value: '0', valueKind: 'number', description: 'Annual leave validation' },
  ];

  for (const c of configs) {
    await prisma.systemConfiguration.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        value: c.value ?? null,
        valueDate: c.valueDate ?? null,
        valueKind: c.valueKind,
        description: c.description ?? null,
      },
      update: {
        name: c.name,
        value: c.value ?? null,
        valueDate: c.valueDate ?? null,
        valueKind: c.valueKind,
        description: c.description ?? null,
      },
    });
  }
}

async function seedUserTypes() {
  const types = [
    { id: 1, name: 'Executive', order: 1 },
    { id: 2, name: 'Manager', order: 2 },
    { id: 3, name: 'SystemAdmin', order: 3 },
    { id: 4, name: 'HRAdmin', order: 4 },
  ];

  for (const t of types) {
    await prisma.userType.upsert({
      where: { id: t.id },
      create: { id: t.id, name: t.name, displayOrder: t.order },
      update: { name: t.name, displayOrder: t.order },
    });
  }
}

async function seedRoles() {
  // D-016: legacy duplicate "Admin" rows are deduplicated here.
  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'Employee' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      create: { id: r.id, name: r.name },
      update: { name: r.name },
    });
  }
}

async function seedDocumentTypes() {
  const types = [
    { id: 1, name: 'Passport' },
    { id: 2, name: 'Work Permit' },
    { id: 3, name: 'Emirates Id' },
    { id: 4, name: 'Health Insurance' },
    { id: 5, name: 'Trade License' },
    { id: 6, name: 'Driving License' },
    { id: 106, name: 'nol' },
    { id: 107, name: 'Visa' },
    { id: 108, name: 'Traffic Fine' },
    { id: 109, name: 'Warning Letter' },
    { id: 110, name: 'Accident Document' },
  ];

  for (const t of types) {
    await prisma.documentType.upsert({
      where: { id: t.id },
      create: { id: t.id, name: t.name },
      update: { name: t.name },
    });
  }
}

async function seedMenuItems() {
  // Phase-1 relevant menu tree subset extracted from legacy menu catalog.
  const items: Array<{ id: number; name: string; parentId?: number; pageUrl?: string; iconClass?: string; displayOrder: number; isMainMenu: boolean; isActive: boolean }> = [
    // Root menus first
    { id: 37, name: 'Profile', iconClass: 'fa fa-book', displayOrder: 1, isMainMenu: true, isActive: true },
    { id: 155, name: 'Profile', displayOrder: 2, isMainMenu: true, isActive: true },
    { id: 2, name: 'Master Setup', iconClass: 'fa fa-cogs', displayOrder: 2, isMainMenu: true, isActive: true },
    // Children of Profile (37)
    { id: 1, name: 'Employee List', parentId: 37, pageUrl: '/profilelist', iconClass: 'fa fa-users', displayOrder: 1, isMainMenu: true, isActive: true },
    { id: 12, name: 'Document List', parentId: 37, pageUrl: '/documentlist', iconClass: 'fa fa-folder-open-o', displayOrder: 2, isMainMenu: true, isActive: true },
    { id: 156, name: 'My Profile', parentId: 37, pageUrl: '/myprofile', iconClass: 'fa fa-user-secret', displayOrder: 3, isMainMenu: true, isActive: true },
    // Children of Master Setup (2)
    { id: 3, name: 'Language', parentId: 2, displayOrder: 1, isMainMenu: false, isActive: true },
    { id: 4, name: 'Role', parentId: 2, displayOrder: 2, isMainMenu: false, isActive: true },
    { id: 6, name: 'Department', parentId: 2, displayOrder: 3, isMainMenu: false, isActive: true },
    { id: 7, name: 'Site', parentId: 2, displayOrder: 4, isMainMenu: false, isActive: true },
    { id: 21, name: 'Document Type', parentId: 2, displayOrder: 5, isMainMenu: false, isActive: true },
    // Children of Profile (155)
    { id: 146, name: 'Basic & Work Details', parentId: 155, displayOrder: 1, isMainMenu: false, isActive: true },
    { id: 147, name: 'Document', parentId: 155, displayOrder: 2, isMainMenu: false, isActive: true },
    { id: 151, name: 'Dependants', parentId: 155, displayOrder: 3, isMainMenu: false, isActive: true },
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
