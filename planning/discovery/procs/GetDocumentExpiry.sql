
-- =============================================
-- Author:		Mohseena	
-- Create date: 06/09/2021
-- Description:	GetDocumentExpiry 126
-- =============================================
CREATE PROCEDURE GetDocumentExpiry
(
  @ProfileId int
)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	SELECT top 1 ProfileId, VisaIssueDate  IssueDate ,  VisaExpiryDate ExpiryDate, 'VISA' DocName from  [dbo].[VisaDocView] (nolock) where ProfileId =@ProfileId	
	UNION
	SELECT top 1 ProfileId, PassportIssueDate  IssueDate ,  PassportExpiryDate ExpiryDate,'Passport' DocName from  [dbo].[PassportDocView] (nolock) where ProfileId =@ProfileId
	order by ExpiryDate desc
END

