-- =============================================
-- Author:		Mohseena
-- Create date: 12/12/2019
-- Description:	retrieved menu usertype List
--	[GetMenuUserTypeList] 2
-- =============================================
create proc GetMenuUserTypeList
(
@UserTypeId int =  null
)
as
begin
	Declare @IsSelectedTrue bit = 1
	Declare @IsSelectedFalse bit = 0	

	select isnull(MI.MenuParentId,0) MenuParentId,MI.MenuItemId,MI.MenuName,
	case when MF.UserTypeId is null then @IsSelectedFalse else @IsSelectedTrue end IsSelected,
	MI.MenuValue, isnull(MP.MenuValue,0) MenuParentValue ,MI.DisplayName
	from system.MenuItem MI with(nolock)
	left join system.MenuItem MP on MP.MenuItemId = MI.MenuParentId
	left join system.MenuUserType MF on MI.MenuItemId = MF.MenuItemId 
	and MF.UserTypeId = @UserTypeId
	where  MI.IsActive = 1

end

