-- =============================================
-- Author:		Gaurav 	
-- Create date: 15/06/2020
-- Description:	Rset Password
--[dbo].[GetSiteUserDataList] null,'',null,0,25,1,'Name',''
-- =============================================
CREATE PROCEDURE ResetPassword
(
 @SiteUserId int =null,
 @Password varchar(200) = null,
 @UserName varchar(200) = null,
 @UserType int = null
)	
AS
BEGIN

	SET NOCOUNT ON;
  
	Begin 

	Update usr.SiteUser set Password = @Password,UserName = @UserName,UserTypeId = @UserType where SiteUserId = @SiteUserId

	END
	 SET NOCOUNT OFF;   

END


