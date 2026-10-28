-- =============================================
-- Author:		Mohseena
-- Create date: 29/06/2020
-- Description:	delete all users except hr admin
-- =============================================
Create PROCEDURE [dbo].[CleanupInActiveUser]
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	


	
delete from usr.Employee where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.ProfileDepartment where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.ProfileLanguage where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from HRMS.LeaveSummary where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.Attendance where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from HRMS.Document  where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from master.FileDocMapping where DocId in ( select DocumentId from HRMS.Document  where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5))
delete from master.FileDoc where FileDocId in (
227,
228,
229,
230,
231)
delete from usr.SiteUser where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.Account where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.EmployeePayrollMaster where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.EmployeeOTMaster where ProfileId in ( select ProfileId from usr.Profile where StatusId = 5)
delete from usr.Profile where StatusId = 5
END

