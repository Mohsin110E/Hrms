-- =============================================
-- Author:		Krishna
-- Create date: 12/06/2019
-- Description:	<Description,,>
--GetMenuItemList 4,0,34
-- =============================================
CREATE PROCEDURE  GetMenuItemList
(
 @ProfileId int,
 @IsMainMenu bit,
 @MenuItemValue tinyint = null
)
AS
BEGIN
	
	SET NOCOUNT ON;   
	
	Declare @RoleId tinyint
	select  @RoleId = u.UserTypeId from usr.Profile p INNER Join usr.siteuser u on u.ProfileId=p.ProfileId where p.ProfileId = @ProfileId
	declare @MenuParentId int 
    set     @MenuParentId = (select MenuItemId from system.MenuItem where MenuValue = @MenuItemValue)

	
	SELECT mn.MenuItemId,ISNULL(mn.DisplayName,mn.MenuName) As MenuName,mn.MenuParentId,mn.CssClass,mn.IsActive,mn.PageUrl,
	mn.MenuValue,mr.UserTypeId,pr.MenuValue MenuParentValue
	from system.MenuItem mn with(nolock)
	Join system.MenuUsertype mr with(nolock) on mr.MenuItemId = mn.MenuItemId
	Left outer Join system.MenuItem pr with(nolock) on  pr.MenuItemId = mn.MenuParentId
	where mr.UserTypeId= @RoleId 
	     and (@MenuParentId is null OR mn.MenuParentId= @MenuParentId)
		and (@IsMainMenu is null OR mn.IsMainMenu =@IsMainMenu)
		and mn.IsActive = 1 
		Order by mn.MenuOrder
	
	
END



