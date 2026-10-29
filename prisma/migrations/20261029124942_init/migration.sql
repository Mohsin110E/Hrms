-- CreateTable
CREATE TABLE "user_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "userTypeId" INTEGER,
    "statusId" INTEGER,
    "customerId" INTEGER,
    "name" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "contactNo" TEXT,
    "dateOfBirth" DATE,
    "maritalStatusId" INTEGER,
    "genderId" INTEGER,
    "motherTongueId" INTEGER,
    "bloodGroupId" INTEGER,
    "nationalityId" INTEGER,
    "visaTypeId" INTEGER,
    "photoFileId" BIGINT,
    "address" TEXT,
    "linkId" INTEGER,
    "isSiteAccess" BOOLEAN NOT NULL DEFAULT false,
    "qualification" TEXT,
    "homeCountryAddress" TEXT,
    "homeCountryPhoneNo" TEXT,
    "contractTypeId" INTEGER,
    "dateOfExit" TIMESTAMPTZ(3),
    "exitReasonCode" INTEGER,
    "exitRemarks" TEXT,
    "dateOfRejoining" TIMESTAMPTZ(3),
    "passportNoEnc" TEXT,
    "passportNoHash" TEXT,
    "emiratesIdEnc" TEXT,
    "emiratesIdHash" TEXT,
    "molNoEnc" TEXT,
    "molNoHash" TEXT,
    "visaNoEnc" TEXT,
    "visaNoHash" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "userTypeId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "legacyPasswordEnc" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastLoginAt" TIMESTAMPTZ(3),
    "lastIpUsed" TEXT,
    "passwordChangedAt" TIMESTAMPTZ(3),
    "isPasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttemptAt" TIMESTAMPTZ(3),
    "lockedUntil" TIMESTAMPTZ(3),

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "requestedIp" TEXT,
    "usedIp" TEXT,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "logTypeId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "lastUsedAt" TIMESTAMPTZ(3) NOT NULL,
    "rotatedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "revokedReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_time_login_tokens" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "usedIp" TEXT,

    CONSTRAINT "one_time_login_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actorProfileId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "pageUrl" TEXT,
    "iconClass" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "isMainMenu" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_user_type_permissions" (
    "id" SERIAL NOT NULL,
    "userTypeId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "pageUrlOverride" TEXT,
    "isCreate" BOOLEAN NOT NULL DEFAULT false,
    "isEdit" BOOLEAN NOT NULL DEFAULT false,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "menu_user_type_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_user_overrides" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "isInclude" BOOLEAN NOT NULL,
    "pageUrlOverride" TEXT,

    CONSTRAINT "menu_user_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "shortDesc" TEXT,
    "messageTypeId" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configurations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT,
    "valueDate" DATE,
    "valueKind" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,

    CONSTRAINT "system_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "parameter_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameters" (
    "id" SERIAL NOT NULL,
    "parameterTypeId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "parameterValue" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "code" TEXT,

    CONSTRAINT "parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "lateMinutes" INTEGER NOT NULL,
    "halfDayMinutes" INTEGER NOT NULL,
    "altStartTime" TIME,
    "altEndTime" TIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_off_configs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" INTEGER,
    "daysOfWeek" INTEGER[],
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "weekly_off_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_off_assignments" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "weeklyOffConfigId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "weekly_off_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_lists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "holiday_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendar_entries" (
    "id" SERIAL NOT NULL,
    "holidayListId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "prevHolidayDate" DATE,

    CONSTRAINT "holiday_calendar_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_entities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "legacyTableName" TEXT,
    "legacyPrimaryKey" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "form_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" SERIAL NOT NULL,
    "entityId" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "dataTypeId" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "validationRegex" TEXT,
    "isForeignKey" BOOLEAN NOT NULL DEFAULT false,
    "foreignEntityId" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isGridVisible" BOOLEAN NOT NULL DEFAULT true,
    "documentTypeId" INTEGER,
    "config" JSONB,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "reportingToId" INTEGER,
    "sourceOfHireId" INTEGER,
    "locationId" INTEGER,
    "siteId" INTEGER,
    "employeeStatusId" INTEGER,
    "employeeTypeId" INTEGER,
    "contractTypeId" INTEGER,
    "workPhone" TEXT,
    "extension" TEXT,
    "workEmail" TEXT,
    "dateOfJoining" TIMESTAMPTZ(3) NOT NULL,
    "dateOfConfirmation" TIMESTAMPTZ(3),
    "personIdNumberEnc" TEXT,
    "personIdNumberHash" TEXT,
    "designation" TEXT,
    "shiftId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "exitUploadId" INTEGER,
    "isWPSProcessing" BOOLEAN,
    "isSalaryProcessing" BOOLEAN,
    "isAttendanceProcessing" BOOLEAN,
    "companyMobileNo" TEXT,
    "companyLandNo" TEXT,
    "payrollSiteId" INTEGER,
    "isAllowedAdvanceLeave" BOOLEAN,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_departments" (
    "profileId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "profile_departments_pkey" PRIMARY KEY ("profileId","departmentId")
);

-- CreateTable
CREATE TABLE "dependants" (
    "id" SERIAL NOT NULL,
    "dependantProfileId" INTEGER NOT NULL,
    "employeeProfileId" INTEGER NOT NULL,
    "relationTypeId" INTEGER,

    CONSTRAINT "dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "accountName" TEXT,
    "accountNoEnc" TEXT,
    "accountNoHash" TEXT,
    "bankName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" BIGSERIAL NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "issueDate" DATE,
    "expiryDate" DATE,
    "identityNoEnc" TEXT,
    "identityNoHash" TEXT,
    "documentTitle" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSelf" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_field_values" (
    "id" BIGSERIAL NOT NULL,
    "documentId" BIGINT NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "value" TEXT,
    "valueEnc" TEXT,

    CONSTRAINT "document_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" BIGSERIAL NOT NULL,
    "originalName" TEXT NOT NULL,
    "legacyFolderPath" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "sha256" TEXT,
    "fileTypeId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_files" (
    "id" BIGSERIAL NOT NULL,
    "documentId" BIGINT NOT NULL,
    "fileId" BIGINT NOT NULL,
    "fieldId" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expiry_alert_logs" (
    "id" BIGSERIAL NOT NULL,
    "documentId" BIGINT NOT NULL,
    "alertWindow" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipients" TEXT NOT NULL,
    "runId" TEXT NOT NULL,

    CONSTRAINT "expiry_alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_types_name_key" ON "user_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_linkId_key" ON "profiles"("linkId");

-- CreateIndex
CREATE INDEX "profiles_statusId_idx" ON "profiles"("statusId");

-- CreateIndex
CREATE INDEX "profiles_passportNoHash_idx" ON "profiles"("passportNoHash");

-- CreateIndex
CREATE INDEX "profiles_emiratesIdHash_idx" ON "profiles"("emiratesIdHash");

-- CreateIndex
CREATE INDEX "profiles_molNoHash_idx" ON "profiles"("molNoHash");

-- CreateIndex
CREATE INDEX "profiles_visaNoHash_idx" ON "profiles"("visaNoHash");

-- CreateIndex
CREATE UNIQUE INDEX "users_profileId_key" ON "users"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_activities_userId_key" ON "user_activities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_createdAt_idx" ON "activity_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_logTypeId_idx" ON "activity_logs"("logTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "one_time_login_tokens_tokenHash_key" ON "one_time_login_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "audit_logs_actorProfileId_idx" ON "audit_logs"("actorProfileId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "menu_user_type_permissions_userTypeId_menuItemId_key" ON "menu_user_type_permissions"("userTypeId", "menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_user_overrides_userId_menuItemId_key" ON "menu_user_overrides"("userId", "menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_code_key" ON "messages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "system_configurations_name_key" ON "system_configurations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_types_name_key" ON "parameter_types"("name");

-- CreateIndex
CREATE INDEX "parameters_parameterTypeId_idx" ON "parameters"("parameterTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "parameters_parameterTypeId_text_key" ON "parameters"("parameterTypeId", "text");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sites_name_key" ON "sites"("name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_name_key" ON "shifts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_off_configs_siteId_year_name_key" ON "weekly_off_configs"("siteId", "year", "name");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_off_assignments_profileId_year_key" ON "weekly_off_assignments"("profileId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendar_entries_profileId_holidayListId_date_key" ON "holiday_calendar_entries"("profileId", "holidayListId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "form_entities_key_key" ON "form_entities"("key");

-- CreateIndex
CREATE INDEX "form_fields_entityId_idx" ON "form_fields"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_entityId_fieldName_documentTypeId_key" ON "form_fields"("entityId", "fieldName", "documentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_profileId_key" ON "employees"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE INDEX "employees_siteId_idx" ON "employees"("siteId");

-- CreateIndex
CREATE INDEX "employees_reportingToId_idx" ON "employees"("reportingToId");

-- CreateIndex
CREATE INDEX "employees_personIdNumberHash_idx" ON "employees"("personIdNumberHash");

-- CreateIndex
CREATE UNIQUE INDEX "dependants_dependantProfileId_employeeProfileId_key" ON "dependants"("dependantProfileId", "employeeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_profileId_key" ON "bank_accounts"("profileId");

-- CreateIndex
CREATE INDEX "bank_accounts_accountNoHash_idx" ON "bank_accounts"("accountNoHash");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE INDEX "documents_profileId_isActive_idx" ON "documents"("profileId", "isActive");

-- CreateIndex
CREATE INDEX "documents_documentTypeId_idx" ON "documents"("documentTypeId");

-- CreateIndex
CREATE INDEX "documents_identityNoHash_idx" ON "documents"("identityNoHash");

-- CreateIndex
CREATE INDEX "documents_expiryDate_isActive_idx" ON "documents"("expiryDate", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "document_field_values_documentId_fieldId_key" ON "document_field_values"("documentId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_storageKey_key" ON "stored_files"("storageKey");

-- CreateIndex
CREATE INDEX "stored_files_fileTypeId_idx" ON "stored_files"("fileTypeId");

-- CreateIndex
CREATE INDEX "document_files_fileId_idx" ON "document_files"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "document_files_documentId_fileId_fieldId_key" ON "document_files"("documentId", "fileId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "expiry_alert_logs_documentId_alertWindow_runId_key" ON "expiry_alert_logs"("documentId", "alertWindow", "runId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "user_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_time_login_tokens" ADD CONSTRAINT "one_time_login_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_user_type_permissions" ADD CONSTRAINT "menu_user_type_permissions_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "user_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_user_type_permissions" ADD CONSTRAINT "menu_user_type_permissions_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_user_overrides" ADD CONSTRAINT "menu_user_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_user_overrides" ADD CONSTRAINT "menu_user_overrides_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parameters" ADD CONSTRAINT "parameters_parameterTypeId_fkey" FOREIGN KEY ("parameterTypeId") REFERENCES "parameter_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_off_configs" ADD CONSTRAINT "weekly_off_configs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_off_assignments" ADD CONSTRAINT "weekly_off_assignments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_off_assignments" ADD CONSTRAINT "weekly_off_assignments_weeklyOffConfigId_fkey" FOREIGN KEY ("weeklyOffConfigId") REFERENCES "weekly_off_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_lists" ADD CONSTRAINT "holiday_lists_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_calendar_entries" ADD CONSTRAINT "holiday_calendar_entries_holidayListId_fkey" FOREIGN KEY ("holidayListId") REFERENCES "holiday_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_calendar_entries" ADD CONSTRAINT "holiday_calendar_entries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "form_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingToId_fkey" FOREIGN KEY ("reportingToId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_departments" ADD CONSTRAINT "profile_departments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_departments" ADD CONSTRAINT "profile_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependants" ADD CONSTRAINT "dependants_dependantProfileId_fkey" FOREIGN KEY ("dependantProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependants" ADD CONSTRAINT "dependants_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_field_values" ADD CONSTRAINT "document_field_values_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_field_values" ADD CONSTRAINT "document_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "form_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expiry_alert_logs" ADD CONSTRAINT "expiry_alert_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
