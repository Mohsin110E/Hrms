-- =============================================
-- Author:		Mohseen	
-- Create date: 11/18/2019
-- Description:	get user list
-- exec GetReportingUserList null, 2, null, null, null
-- =============================================
CREATE PROCEDURE [dbo].[GetReportingUserList] (
	@LoggedInUserId INT,
	@SiteId VARCHAR(2000) = NULL,
	@DepartmentId VARCHAR(2000) = NULL,
	@PayrollBatchId SMALLINT = NULL,
	@IsPayroll BIT = 0
	)
AS
BEGIN
	SET NOCOUNT ON;

	BEGIN
		DECLARE @userLevel INT,
			@userType INT,
			@reportingUsers VARCHAR(Max)

		SELECT @userlevel = TypeLevel,
			@userType = UserTypeId
		FROM ProfileView
		WHERE ProfileId = @loggedInUserId

		SET @reportingUsers = dbo.ReportingToUsersFN(@LoggedInUserId)
		
		SET @IsPayroll = isnull(@IsPayroll, 0)

		SELECT DISTINCT pf.ProfileId,
			CAST(0 AS TINYINT) AS RoleId,
			'' AS RoleName,
			CAST(0 AS TINYINT) AS RoleLevel,
			su.UserTypeId,
			pf.StatusId,
			pf.Name,
			pf.LastName,
			em.Designation,
			pf.Email,
			pf.ContactNo,
			pf.DOB,
			pm.ParameterValue StatusValue,
			pm.TEXT STATUS,
			us.Name UserTypeText,
			su.SiteUserId,
			s.SiteName,
			em.EmployeeCode,
			gd.ParameterValue GenderValue,
			gd.TEXT Gender,
			dp.DepartmentId,
			dp.DepartmentName,
			pf.MiddleName
		FROM usr.PROFILE pf
		WITH (NOLOCK)
		LEFT JOIN usr.SiteUser su WITH (NOLOCK) ON su.ProfileId = pf.ProfileId
		-- left Join master.Role sr with(nolock) on sr.RoleId = su.RoleId
		JOIN system.Parameter pm WITH (NOLOCK) ON pm.ParameterId = pf.StatusId
		LEFT JOIN master.UserType us WITH (NOLOCK) ON us.UserTypeId = su.UserTypeId
		JOIN usr.Employee em WITH (NOLOCK) ON em.ProfileId = pf.ProfileId
		LEFT JOIN usr.ProfileDepartment pd WITH (NOLOCK) ON pd.profileId = pf.ProfileId
		LEFT JOIN master.Department dp WITH (NOLOCK) ON dp.departmentId = pd.departmentId
		LEFT JOIN master.Site s WITH (NOLOCK) ON s.SiteId = em.SiteId
		LEFT JOIN system.Parameter gd WITH (NOLOCK) ON gd.ParameterTypeId = 10
			AND gd.ParameterId = pf.Gender
		WHERE pm.ParameterValue = 1
			AND (
				@reportingUsers IS NULL
				OR @userLevel = 4
				OR pf.ProfileId IN (
					SELECT value
					FROM dbo.SplitFn(@reportingUsers, ',')
					)
				)
			AND (
				@SiteId IS NULL
				OR em.SiteId IS NULL
				OR (
					@IsPayroll = 1
					AND isnull(em.PayrollSiteId, em.SiteId) IN (
						SELECT value
						FROM dbo.SplitFn(@SiteId, ',')
						)
					OR @IsPayroll = 0
					AND (
						em.SiteId IN (
							SELECT value
							FROM dbo.SplitFn(@SiteId, ',')
							)
						)
					)
				)
			AND (
				@DepartmentId IS NULL
				OR pd.DepartmentId IN (
					SELECT value
					FROM dbo.SplitFn(@DepartmentId, ',')
					)
				)
			AND (
				@PayrollBatchId IS NULL
				OR dp.PayrollBatchId = @PayrollBatchId
				)
		ORDER BY pf.Name,
			pf.LastName ASC
		OPTION (MAXRECURSION 0)
	END

	SET NOCOUNT OFF;
END
