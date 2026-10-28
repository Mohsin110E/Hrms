-- =============================================
-- Author		: Gaurav Narkar
-- Create date	: 10/06/2020
-- Description	: To get the profile information from the document
---- Test Case	: EXEC GetHoliday null
-- =============================================
CREATE PROCEDURE [dbo].[GetProfileInfoForDocument]
@DocumentId int = 0

AS
BEGIN

select P.ProfileId,ISNULL(P.Name,'')+' '+ISNULL(P.Lastname,'')+' '+case when ISNULL(E.Employeecode,'') != '' then '('+E.EmployeeCode+')' else '' end As EmployeeName
from [HRMS].[Document] D
INNER JOIN usr.Profile P on P.ProfileId = D.ProfileId
INNER JOIN usr.Employee E on E.ProfileId = D.ProfileId
where D.DocumentId = @DocumentId

END

