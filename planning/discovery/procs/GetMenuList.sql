-- =============================================
-- Author:		Krishna
-- Create date: 12/06/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
-- =============================================
Create PROCEDURE  [dbo].[GetMenuList]
(
 @ProfileId int,
 @IsMainMenu bit 
)
AS
BEGIN
	
	SET NOCOUNT ON;   
	
	Declare @RoleId tinyint
	select @RoleId = @ProfileId from usr.SiteUser where ProfileId = @ProfileId
	
	
	SELECT mn.MenuItemId,mn.MenuName,mn.MenuParentId,mn.CssClass,mn.IsActive,mn.PageUrl,
	mn.MenuValue,mr.MenuRoleId,pr.MenuValue MenuParentValue
	from system.MenuItem mn with(nolock)
	Join system.MenuRole mr with(nolock) on mr.MenuItemId = mn.MenuItemId
	Left outer Join system.MenuItem pr with(nolock) on  pr.MenuItemId = mn.MenuParentId
	where mr.RoleId = @RoleId
	
	and mn.IsActive = 1
	
END

