-- =============================================
-- Author:		Krishna
-- Create date: 12/10/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
-- =============================================
CREATE PROCEDURE [dbo].[AddUpdateProfile] (
	@ProfileId INT = NULL,
	@Name VARCHAR(150) = NULL,
	@LastName VARCHAR(150) = NULL,
	@Designation VARCHAR(150) = NULL,
	@Email VARCHAR(250) = NULL,
	@ContactNo VARCHAR(20) = NULL,
	@DOB DATE = NULL,
	@CreatedBy INT = NULL,
	@MiddleName VARCHAR(150) = NULL,
	@MaritalStatus SMALLINT = NULL,
	@Gender SMALLINT = NULL,
	@MotherTongue INT = NULL,
	@BloodGroup SMALLINT = NULL,
	@PhotoId INT = NULL,
	@Address VARCHAR(2000) = NULL,
	@EmployeeId INT = NULL,
	@EmployeeCode NVARCHAR(10) = NULL,
	@ReportingTo INT = NULL,
	@SourceOfHire SMALLINT = NULL,
	@Location INT = NULL,
	@SiteId INT = NULL,
	@EmployeeStatusId SMALLINT = NULL,
	@EmployeeTypeId SMALLINT = NULL,
	@WorkPhone NVARCHAR(10) = NULL,
	@Extension NVARCHAR(10) = NULL,
	@WorkEmail NVARCHAR(200) = NULL,
	@DateOfJoining DATETIME = NULL,
	@DateofConfirmation DATETIME = NULL,
	@Qualification NVARCHAR(200) = NULL,
	@DateofExit DATETIME = NULL,
	@ExitReasonCode SMALLINT = NULL,
	@ExitRemarks NVARCHAR(max) = NULL,
	@ExitUploadId INT = NULL,
	@AccountName VARCHAR(200) = NULL,
	@Bankname VARCHAR(200) = NULL,
	@AccountNo VARCHAR(200) = NULL,
	@IBAN VARCHAR(200) = NULL,
	@Branch VARCHAR(200) = NULL,
	@SWIFT VARCHAR(200) = NULL,
	@DependantType DependantType READONLY,
	@AccountId INT = NULL,
	@LanguageIds VARCHAR(100) = NULL,
	@DepartmentIds VARCHAR(100) = NULL,
	@UserStatusId SMALLINT = NULL,
	@UserTypeId INT = NULL,
	@PersonIDNumber VARCHAR(20) = NULL,
	@RoutingNumber VARCHAR(200) = NULL,
	@SiteUserId INT = NULL,
	@UserName VARCHAR(200) = NULL,
	@Password VARCHAR(200) = NULL,
	@DateOfRejoining DATETIME = NULL,
	@NationalityId INT = NULL,
	@PassportNo VARCHAR(50),
	@EmiratesId VARCHAR(50),
	@MOLNo VARCHAR(50),
	@VisaNo VARCHAR(50),
	@VisaTypeId INT,
	@IsSiteAccess BIT,
	@ShiftId INT = NULL,
	@CompanyMobileNo VARCHAR(20) = NULL,
	@CompanyLandNo VARCHAR(20) = NULL,
	@HomeCountryAddress VARCHAR(2000) = NULL,
	@HomeCountryPhoneNo VARCHAR(20) = NULL,
	@ContractTypeId SMALLINT = NULL,
	@PayrollSiteId INT = NULL,
	@ObjectProfileId AS INT = 0 OUTPUT,
	@MsgIdResult AS INT = 0 OUTPUT
	)
AS
BEGIN
	SET NOCOUNT ON;

	IF (@IsSiteAccess = 0)
	BEGIN
		SET @UserName = NULL
		SET @Password = NULL
	END

	IF EXISTS (
			SELECT *
			FROM usr.PROFILE
			WHERE (
					ProfileId != @ProfileId
					OR @ProfileId IS NULL
					)
				AND Email = @Email
				AND @Email IS NOT NULL
			)
	BEGIN
		SET @MsgIdResult = 6
	END
	ELSE IF EXISTS (
			SELECT *
			FROM usr.Employee
			WHERE (
					ProfileId != @ProfileId
					OR @ProfileId IS NULL
					)
				AND EmployeeCode = @EmployeeCode
			)
	BEGIN
		SET @MsgIdResult = 7
	END
	ELSE
	BEGIN
		BEGIN TRANSACTION

		BEGIN TRY
			DECLARE @tmpDependanttype TABLE (
				ID INT IDENTITY(1, 1) PRIMARY KEY,
				DependantId INT,
				DependantProfileId INT,
				DependantRelationTypeId SMALLINT,
				EmployeeProfileId INT,
				userName VARCHAR(150)
				)

			IF (@ProfileId IS NULL)
			BEGIN
				INSERT INTO [usr].[Profile] (
					[Name],
					[LastName],
					[Email],
					[ContactNo],
					[DOB],
					[CreatedBy],
					[CreatedDate],
					[MiddleName],
					[MaritalStatus],
					[Gender],
					[MotherTongue],
					[BloodGroup],
					[PhotoId],
					[Address],
					StatusId,
					IsUpdated,
					Nationality,
					PassportNo,
					EmiratesId,
					MOLNo,
					VisaNo,
					VisaType,
					IsSiteAccess,
					[DateofExit],
					[ExitReasonCode],
					[ExitRemarks],
					[DateOfRejoining],
					[Qualification],
					HomeCountryAddress,
					HomeCountryPhoneNo,
					ContractTypeId
					)
				VALUES (
					@Name,
					@LastName,
					@Email,
					@ContactNo,
					@DOB,
					@CreatedBy,
					GETDATE(),
					@MiddleName,
					@MaritalStatus,
					@Gender,
					@MotherTongue,
					@BloodGroup,
					@PhotoId,
					@Address,
					@UserStatusId,
					1,
					@NationalityId,
					@PassportNo,
					@EmiratesId,
					@MOLNo,
					@VisaNo,
					@VisaTypeId,
					@IsSiteAccess,
					@DateofExit,
					@ExitReasonCode,
					@ExitRemarks,
					@DateOfRejoining,
					@Qualification,
					@HomeCountryAddress,
					@HomeCountryPhoneNo,
					@ContractTypeId
					)

				SET @ProfileId = IDENT_CURRENT('[usr].[Profile]')
			END
			ELSE
			BEGIN
				UPDATE [usr].[Profile]
				SET [Name] = CASE 
						WHEN @Name IS NULL
							THEN Name
						ELSE @Name
						END,
					[LastName] = @LastName,
					[Email] = @Email,
					[ContactNo] = @ContactNo,
					[DOB] = @DOB,
					[MiddleName] = @MiddleName,
					[MaritalStatus] = @MaritalStatus,
					[Gender] = CASE 
						WHEN @Gender IS NULL
							THEN Gender
						ELSE @Gender
						END,
					[MotherTongue] = @MotherTongue,
					[BloodGroup] = @BloodGroup,
					[PhotoId] = @PhotoId,
					[Address] = @Address,
					[StatusId] = CASE 
						WHEN @UserStatusId IS NULL
							THEN StatusId
						ELSE @UserStatusId
						END,
					[IsUpdated] = 1,
					Nationality = @NationalityId,
					PassportNo = @PassportNo,
					EmiratesId = @EmiratesId,
					MOLNo = @MOLNo,
					VisaNo = @VisaNo,
					VisaType = @VisaTypeId,
					IsSiteAccess = @IsSiteAccess,
					[DateofExit] = @DateofExit,
					[ExitReasonCode] = @ExitReasonCode,
					[ExitRemarks] = @ExitRemarks,
					DateOfRejoining = @DateOfRejoining,
					[Qualification] = @Qualification,
					HomeCountryAddress = @HomeCountryAddress,
					HomeCountryPhoneNo = @HomeCountryPhoneNo,
					ContractTypeId = @ContractTypeId
				WHERE ProfileId = @ProfileId
			END

			IF (@EmployeeId IS NULL)
			BEGIN
				INSERT INTO [usr].[Employee] (
					[EmployeeCode],
					[ReportingTo],
					[SourceOfHire],
					[Location],
					[SiteId],
					[EmployeeStatusId],
					[EmployeeTypeId],
					[WorkPhone],
					[Extension],
					[WorkEmail],
					[DateOfJoining],
					[DateofConfirmation],
					[ProfileId],
					[ExitUploadId],
					[PersonIDNumber],
					[Designation],
					ShiftId,
					IsAttendanceprocessing,
					IsWPSProcessing,
					IsSalaryProcessing,
					CompanyMobileNo,
					CompanyLandNo,
					PayrollSiteId
					)
				--default true
				VALUES (
					@EmployeeCode,
					@ReportingTo,
					@SourceOfHire,
					@Location,
					@SiteId,
					@EmployeeStatusId,
					@EmployeeTypeId,
					@WorkPhone,
					@Extension,
					@WorkEmail,
					@DateOfJoining,
					@DateofConfirmation,
					@ProfileId,
					@ExitUploadId,
					@PersonIDNumber,
					@Designation,
					@ShiftId,
					1,
					1,
					1,
					@CompanyMobileNo,
					@CompanyLandNo,
					@PayrollSiteId
					)
			END
			ELSE
			BEGIN
				UPDATE [usr].[Employee]
				SET [EmployeeCode] = @EmployeeCode,
					[ReportingTo] = @ReportingTo,
					[SourceOfHire] = @SourceOfHire,
					[Location] = @Location,
					[SiteId] = @SiteId,
					[EmployeeStatusId] = @EmployeeStatusId,
					[EmployeeTypeId] = @EmployeeTypeId,
					[WorkPhone] = @WorkPhone,
					[Extension] = @Extension,
					[WorkEmail] = @WorkEmail,
					[DateOfJoining] = @DateOfJoining,
					[DateofConfirmation] = @DateofConfirmation,
					[ExitUploadId] = @ExitUploadId,
					[PersonIDNumber] = @PersonIDNumber,
					[Designation] = @Designation,
					[ShiftId] = @ShiftId,
					CompanyMobileNo = @CompanyMobileNo,
					CompanyLandNo = @CompanyLandNo,
					PayrollSiteId = @PayrollSiteId
				WHERE ProfileId = @ProfileId
			END

			IF (
					@ProfileId IS NOT NULL
					AND @UserName IS NOT NULL
					AND @Password IS NOT NULL
					)
			BEGIN
				IF (@SiteUserId IS NULL)
				BEGIN
					INSERT INTO [usr].[SiteUser] (
						[ProfileId],
						[UserTypeId],
						[UserName],
						[Password]
						)
					VALUES (
						@ProfileId,
						@UserTypeId,
						@UserName,
						@Password
						)
				END
				ELSE
				BEGIN
					UPDATE usr.SiteUser
					SET UserName = @UserName,
						Password = @Password,
						UserTypeId = @UserTypeId
					WHERE ProfileId = @ProfileId
				END
			END

			IF (@AccountId IS NULL)
			BEGIN
				INSERT INTO [usr].[Account] (
					[AccountName],
					[Bankname],
					[AccountNo],
					[IBAN],
					[Branch],
					[SWIFT],
					[ProfileId],
					[RoutingNumber]
					)
				VALUES (
					@AccountName,
					@Bankname,
					@AccountNo,
					@IBAN,
					@Branch,
					@SWIFT,
					@ProfileId,
					@RoutingNumber
					)
			END
			ELSE
			BEGIN
				UPDATE [usr].[Account]
				SET [AccountName] = @AccountName,
					[Bankname] = @Bankname,
					[AccountNo] = @AccountNo,
					[IBAN] = @IBAN,
					[Branch] = @Branch,
					[SWIFT] = @SWIFT,
					[RoutingNumber] = @RoutingNumber
				WHERE ProfileId = @ProfileId
			END

			INSERT INTO @tmpDependanttype (
				DependantId,
				DependantProfileId,
				DependantRelationTypeId,
				EmployeeProfileId,
				userName
				)
			SELECT DependantId,
				DependantProfileId,
				DependantRelationTypeId,
				@ProfileId,
				Name
			FROM @DependantType

			DELETE
			FROM usr.dependant
			WHERE DependantId NOT IN (
					SELECT DependantId
					FROM @tmpDependanttype tmp
					WHERE tmp.DependantId IS NOT NULL
					)
				AND usr.dependant.EmployeeProfileId = @ProfileId

			DECLARE @id INT

			WHILE (
					SELECT count('x')
					FROM @tmpDependanttype
					) > 0
			BEGIN
				DECLARE @tempvar INT

				SELECT TOP 1 @Id = ID
				FROM @tmpDependanttype

				DECLARE @tempId INT;

				SELECT @tempId = DependantId
				FROM @tmpDependanttype
				WHERE ID = @Id

				IF (@tempId IS NULL)
				BEGIN
					INSERT INTO usr.PROFILE (Name)
					SELECT userName
					FROM @tmpDependanttype
					WHERE ID = @Id
						AND DependantId IS NULL

					SET @tempvar = IDENT_CURRENT('usr.Profile');

					INSERT INTO usr.Dependant (
						DependantProfileId,
						DependantRelationTypeId,
						EmployeeProfileId
						)
					SELECT @tempvar,
						DependantRelationTypeId,
						EmployeeProfileId
					FROM @tmpDependanttype
					WHERE ID = @Id
						AND DependantId IS NULL;
				END
				ELSE
				BEGIN
					DECLARE @tempDependantProfileId INT;
					DECLARE @tempDependId INT;

					SELECT @tempDependantProfileId = DependantProfileId,
						@tempDependId = DependantId
					FROM @tmpDependanttype
					WHERE ID = @Id
						AND DependantId IS NOT NULL

					UPDATE usr.PROFILE
					SET Name = (
							SELECT userName
							FROM @tmpDependanttype
							WHERE ID = @Id
								AND DependantId IS NOT NULL
							)
					WHERE usr.PROFILE.ProfileId = @tempDependantProfileId;

					UPDATE usr.Dependant
					SET DependantRelationTypeId = (
							SELECT DependantRelationTypeId
							FROM @tmpDependanttype
							WHERE ID = @Id
								AND DependantId IS NOT NULL
							)
					WHERE usr.Dependant.DependantId = @tempDependId
				END

				DELETE
				FROM @tmpDependanttype
				WHERE ID = @id
			END

			--delete from usr.ProfileDepartment where ProfileId = @ProfileId and DepartmentId not in (select value from dbo.SplitFn(@DepartmentIds ,','))
			IF (@DepartmentIds IS NOT NULL)
			BEGIN
				IF (
						(
							SELECT count('c')
							FROM usr.ProfileDepartment
							WHERE profileId = @ProfileId
							) > 0
						)
					UPDATE usr.ProfileDepartment
					SET DepartmentId = @DepartmentIds
					WHERE profileId = @ProfileId
				ELSE
					INSERT INTO usr.ProfileDepartment (
						ProfileId,
						DepartmentId
						)
					SELECT @ProfileId,
						@DepartmentIds
			END
			ELSE
			BEGIN
				DELETE
				FROM usr.ProfileDepartment
				WHERE ProfileId = @ProfileId
			END

			DELETE
			FROM usr.ProfileLanguage
			WHERE ProfileId = @ProfileId
				AND LanguageId NOT IN (
					SELECT value
					FROM dbo.SplitFn(@LanguageIds, ',')
					)

			INSERT INTO usr.ProfileLanguage (
				ProfileId,
				LanguageId
				)
			SELECT @ProfileId,
				value
			FROM dbo.SplitFn(@LanguageIds, ',')
			WHERE value IS NOT NULL
				AND value <> ''
				AND value NOT IN (
					SELECT LanguageId
					FROM usr.ProfileLanguage
					WHERE ProfileId = @ProfileId
					)

			SET @ObjectProfileId = @ProfileId;

			COMMIT TRANSACTION
		END TRY

		BEGIN CATCH
			IF XACT_STATE() <> 0
				ROLLBACK TRANSACTION

			INSERT INTO system.ExceptionLog (
				ErrorNumber,
				ErrorSeverity,
				ErrorState,
				ErrorProcedure,
				ErrorLine,
				ErrorMessage,
				ErrorFrom,
				CreatedOn
				)
			SELECT ERROR_NUMBER(),
				ERROR_SEVERITY(),
				ERROR_STATE(),
				ERROR_PROCEDURE(),
				ERROR_LINE(),
				ERROR_MESSAGE(),
				'SP - AddUpdateProfile',
				GETUTCDATE()

			DECLARE @ErrorMessage VARCHAR(2000)

			SELECT @ErrorMessage = ERROR_MESSAGE()

			RAISERROR (
					@ErrorMessage,
					16,
					1
					)
		END CATCH
			--select @MessageText 
	END
END
