-- =============================================
-- Author:		krishna
-- Create date: 12/10/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
--[dbo].[GetSiteUserMenuItem]  126,null,null,1
-- =============================================
CREATE PROCEDURE [dbo].[GetSiteUserMenuItem]  (
@ProfileId int = null, 
@FunctionTypeValue tinyint =null, 
@MenuItemValue tinyint = null, 
@IsMainMenu bit = 1)
as
begin


 set @MenuItemValue=null
 --set @IsMainMenu=1

		Declare @mentuTempTable table (MenuItemId smallint,PageUrl varchar(350),MenuOrder int)

		Insert into @mentuTempTable (MenuItemId ,PageUrl,MenuOrder)
		select 
		distinct MI.MenuItemId,(case when MR.PageUrl IS NULL or MR.PageUrl = '' then MI.PageUrl else MR.PageUrl end) PageUrl,MenuOrder 
		From system.MenuItem MI 
		inner join usr.Profile SU ON SU.ProfileId=@ProfileId
		Left Join usr.SiteUser SUR on SUR.ProfileId = SU.ProfileId
		inner join system.MenuUserType MR ON MR.MenuItemId=MI.MenuItemId and MR.UserTypeId=SUR.UserTypeId
		inner join Master.[UserType] R ON R.UserTypeId=SUR.UserTypeId 
		where SU.ProfileId=@ProfileId 
	
		

		Declare @MenuSplPermissionTable table(MenuSpecialUserAccessId sMallint, MenuItemId smallint,isInclude bit)

		insert Into  @MenuSplPermissionTable
		Select MenuSpecialUserAccessId, MenuItemId,IsInclude from System.MenuSpecialUserAccess where ProfileId =@ProfileId 

		Declare @MenuITemId smallint
		Declare @IsInlcude bit
		Declare @MenuSpecialUserAccessId smallint
		While(select count('x')  from @MenuSplPermissionTable)>0
		Begin
		select top 1 @MenuSpecialUserAccessId=MenuSpecialUserAccessId, @MenuITemId =MenuItemId,@IsInlcude=isInclude from  @MenuSplPermissionTable  

		if @IsInlcude =1
		begin 
			Insert into @mentuTempTable(MenuItemId,PageUrl,MenuOrder)
			Select MI.MenuItemId, (case when MSP.PageUrl IS NULL or MSP.PageUrl = '' then MI.PageUrl
			else MSP.PageUrl end),MI.MenuOrder  from system.MenuItem MI 
			inner join system.MenuSpecialUserAccess MSP ON MSP.MenuItemId=MI.MenuItemId
			where  MSP.MenuSpecialUserAccessId=@MenuSpecialUserAccessId
		End 
		Else
			begin 

			delete from @mentuTempTable where MenuItemId in (
			Select MenuItemId from  @MenuSplPermissionTable MSP 
			where  MSP.MenuSpecialUserAccessId=@MenuSpecialUserAccessId)

		End 
		Delete from  @MenuSplPermissionTable   where MenuSpecialUserAccessId= @MenuSpecialUserAccessId
		End 

		declare @MenuParentId int 
		set @MenuParentId = (select MenuItemId from system.MenuItem where MenuValue = @MenuItemValue)

		
		select distinct MI.MenuItemId,ISNULL(MI.DisplayName,MI.MenuName) As MenuName,MT.PageUrl,isnull(MI.MenuParentId,0) MenuParentId,
		isnull(MP.MenuValue,0) MenuParentValue,MI.MenuOrder,MI.CssClass,MT.MenuOrder MTMenuOrder,MI.MenuValue,
		MI.DisplayName,MI.IsMainMenu
		From @mentuTempTable MT 
		inner join system.MenuItem MI ON MI.MenuItemId=MT.MenuItemId
		left join system.MenuItem MP ON MI.MenuParentId = MP.MenuItemId
		Where 
		--and   (MI.OrgId is null OR MI.OrgId =@OrgId)
	    (@MenuParentId is null OR MI.MenuParentId= @MenuParentId)
		and (@IsMainMenu is null OR MI.IsMainMenu =@IsMainMenu)
		and MI.IsActive = 1 
		Order by MT.MenuOrder, MI.MenuOrder
end
