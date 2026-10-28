-- =============================================
-- Author:		krishna
-- Create date: 12/10/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
-- =============================================
CREATE PROCEDURE  [dbo].[GetMenuAccessList]
(
 @ProfileId int = null,
 @FunctionId int = null,
 @IsInclude bit = null
)
as
begin


	Declare @IsSelectedTrue bit = 1
	Declare @IsSelectedFalse bit = 0
	DEclare @roleId int;
	 select @roleId = RoleId from  usr.[SiteUser] where ProfileId =@ProfileId; 
	select isnull(MI.MenuParentId,0) MenuParentId,MI.MenuItemId,isnull(MI.DisplayName, MI.MenuName) MenuName,
	MI.MenuValue
	,isnull(MP.MenuValue,0) MenuParentValue 
	from system.MenuItem MI
	left join system.MenuItem MP (nolock) on MP.MenuItemId = MI.MenuParentId
	left join system.MenuRole msp (nolock) on msp.MenuItemId = MI.MenuItemId 
	and msp.RoleId = @roleId 
end

