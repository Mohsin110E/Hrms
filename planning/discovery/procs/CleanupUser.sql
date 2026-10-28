-- =============================================
-- Author:		Mohseena
-- Create date: 29/06/2020
-- Description:	delete all users except hr admin
-- =============================================
CREATE PROCEDURE [dbo].[CleanupUser]
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
	



delete from usr.EmployeePayrollItem
dbcc checkIdent ('usr.EmployeePayrollItem','Reseed',0)
delete from usr.EmployeePayroll
dbcc checkIdent ('usr.EmployeePayroll','Reseed',0)
delete from usr.Employee where ProfileId <> 126
delete from system.Token 
dbcc checkIdent ('system.Token','Reseed',1)
delete from system.DataInputTempTable 
dbcc checkIdent ('system.DataInputTempTable','Reseed',1)
delete from usr.EmployeePayrollMaster where ProfileId <> 126
dbcc checkIdent ('usr.EmployeePayrollMaster','Reseed',1)
delete from usr.EmployeePayrollMasterHistory where ProfileId <> 126
dbcc checkIdent ('usr.EmployeePayrollMasterHistory','Reseed',1)
delete from system.DataInputUpload 
delete from usr.Dependant
dbcc checkIdent ('usr.Dependant','Reseed',1)
delete from HRMS.LeaveRequest
dbcc checkIdent ('HRMS.LeaveRequest','Reseed',1)

delete from master.FileDocMapping
dbcc checkIdent ('master.FileDocMapping','Reseed',1)

select * from master.FileDoc
delete from master.FileDoc
dbcc checkIdent ('master.FileDoc','Reseed',1)

delete from HRMS.CompOffReq
dbcc checkIdent ('HRMS.CompOffReq','Reseed',1)
delete from HRMS.LeaveSummary
dbcc checkIdent ('HRMS.LeaveSummary','Reseed',1)
delete from usr.PMSData
dbcc checkIdent ('usr.PMSData','Reseed',1)
delete from usr.Attendance
dbcc checkIdent ('usr.Attendance','Reseed',1)
delete from usr.Account where ProfileId <> 126
delete from master.AdditinalDocumentValue
dbcc checkIdent ('master.AdditinalDocumentValue','Reseed',1)
delete from HRMS.Document
dbcc checkIdent ('HRMS.Document','Reseed',1)
delete from usr.ProfileLanguage where ProfileId <> 126
delete from usr.ProfileDepartment where ProfileId <> 126
delete from usr.ProfileOT where Profile <> 126
delete from usr.SiteUser where ProfileId <> 126
delete from usr.SiteUserActivity where ProfileId <> 126
delete from usr.SiteUserActivityLog where ProfileId <> 126
update master.Site set CreatedBy =126
update usr.Profile set PhotoId =null
delete from usr.Profile where ProfileId <> 126
update usr.Profile set CreatedBy =126
END

