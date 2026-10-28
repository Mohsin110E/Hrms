-- =============================================
-- Author:		Divya Mathew
-- Create date: 02/02/2021
-- Description: Expired Documents List
-- =============================================
CREATE PROCEDURE [dbo].[GetDocumentsListScheduler] 
(
	@isExpired bit,
	@isExpireInWeek bit,
	@isExpireIn1Month bit,
	@isExpireIn3Month bit
)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @firstDate date,@lastDate date

	IF(@isExpired=1)
	BEGIN
		SELECT @firstDate= DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE())-1, 0) --First day of previous month
		SELECT @lastDate=  DATEADD(DAY,-1, GETDATE()); --Yesterday
		END
	ELSE IF(@isExpireInWeek=1)
	BEGIN
		SELECT @firstDate= GETDATE() --Current day
		SELECT @lastDate=  DATEADD(DAY,7, @firstDate); --Last day of the week
	END
	ELSE IF(@isExpireIn1Month=1)
	BEGIN
		SELECT @firstDate= CONVERT(VARCHAR(25),DATEADD(dd,-(DAY(getdate())-1),getdate()),101) --First day of current month
		SELECT @lastDate=  CONVERT(VARCHAR(25),DATEADD(dd,-(DAY(DATEADD(mm,1,getdate()))),DATEADD(mm,1,getdate())),101) --Last Day of current month
	END
	ELSE 
	BEGIN
		SELECT @firstDate= GETDATE() --current day
		SELECT @lastDate=  DATEADD(MONTH,3, @firstDate); -- last day of the next 3 month
	END


		;WITH d AS
		(
		   SELECT *,
				 ROW_NUMBER() OVER (PARTITION BY ProfileId,DocumentTypeId ORDER BY [DocumentId] DESC) AS rn
		   FROM [HRMS].[Document] Where IsActive=1
		)
		SELECT emp.EmployeeCode, pr.Name+' '+ ISNULL(pr.LastName,'') as EmployeeName,d.[DocumentId],d.[DocumentTypeId],[DocumentName],
		[IssueDate],[ExpiryDate],[IsActive],d.[ProfileId],d.IsSelf,d.[DocumentTitle], ad.Value
		FROM d
		LEFT JOIN  [master].[DocumentType] dd
		ON d.DocumentTypeId=dd.DocumentTypeId
		LEFT JOIN [usr].[Employee] emp 
		ON d.ProfileId= emp.ProfileId
		LEFT JOIN [usr].[Profile] pr
		ON d.ProfileId= pr.ProfileId
		LEFT JOIN [system].[MetaDataDetail] md
		ON d.[DocumentTypeId]= md.DocumentType and md.DataTypeId=17 --17 is for date
		LEFT JOIN [master].[AdditinalDocumentValue] ad
		ON ad.DocumentId = d.DocumentId and ad.MetaDataDetailId= md.MetaDataDetailId
		WHERE rn = 1 and pr.StatusId=4
		AND ISNULL( d.ExpiryDate, ISNULL(CONVERT(date,Value,104),null))>=@firstDate 
		AND ISNULL( d.ExpiryDate, ISNULL(CONVERT(date,Value,104),null))<=@lastDate 
		--and ISNULL(DATEDIFF(day,getdate(),ISNULL( d.ExpiryDate, ISNULL(CONVERT(date,Value,104),null) )),50)<=DAY(EOMONTH(GETDATE()))

	
END
