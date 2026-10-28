
-- =============================================
-- Author:		krishna	
-- Create date: 10/14/2019
-- Description:	get login details
-- Exec GetLogin 'admin','123',null
-- =============================================
CREATE PROCEDURE [dbo].[GetLogin]
	(
	   @UserName nvarchar(500),
	   @Password nvarchar(500),
	   @LinkId nvarchar(500) = null,
	   @AuthToken nvarchar(500) = null
	)
AS
BEGIN

	SET NOCOUNT ON;
   SET NOCOUNT ON;   
 --   Declare @userNameCount int = 0; 
	--select @userNameCount=COUNT(SiteUserId) from usr.SiteUser where UserName = @UserName and Password = @Password

	-- here if usernamecount is greater that zero means entered username is wrong so set invalid record true and get other information 
	-- this change is done to get profile id value at the time of wrong password so later we can use that id for log genertion
	--if(@userNameCount > 0)
	Begin 
		
		declare @LinkProfileId int = null ;
		if( @LinkId is not null)
		begin 
		select @LinkProfileId = ProfileId  from  [HRMS].Token where Authtoken = @LinkId;
		delete from  [HRMS].Token where Authtoken = @LinkId;
		end
	   SELECT su.ProfileId,CAST(0 AS tinyint) as RoleId,'' As RoleName,CAST(0 AS tinyint) as RoleLevel,
	   su.UserTypeId,pf.StatusId,
	   pf.Name,isnull(pf.LastName,'') LastName,em.Designation,pf.Email,pf.ContactNo,pf.DOB
	   ,pm.ParameterValue StatusValue,pm.Text Status,
	   us.Name UserTypeText,cast (0 As bit) InvalidUser,ISNULL(SA.IsUserLocked,0) As IsUserLocked,
	   t.AuthToken,SA.LastLogin,su.SiteUserId,em.SiteId,ge.ParameterValue as Gender,fd.FolderPath,pg.DepartmentId,dt.DepartmentName
	   from usr.SiteUser su with(nolock)
	   Join usr.Profile pf with(nolock) on su.ProfileId = pf.ProfileId	   
	   --Join master.Role sr with(nolock) on sr.RoleId = su.RoleId
	   Join system.Parameter pm with(nolock) on pm.ParameterId = pf.StatusId
	   Join master.UserType us with(nolock) on us.UserTypeId = su.UserTypeId
	   Join usr.Employee em with(nolock) on em.ProfileId = pf.ProfileId	
	   Left Join [usr].[SiteUserActivity] SA with(nolock) on SA.ProfileId = su.ProfileId
	   left join [system].[Token](nolock) t on t.siteuserId = su.siteuserId	 
	   left Join system.Parameter ge with(nolock) on ge.ParameterId = pf.Gender
	   left join master.FileDoc fd with(nolock) on fd.FileDocId = pf.PhotoId
	   left join usr.ProfileDepartment pg with (nolock) on pg.ProfileId =pf.ProfileId
	   left join master.Department dt with (nolock) on dt.DepartmentId = pg.DepartmentId
 	   where (@UserName is null or ( su.UserName = @UserName and su.Password = @Password))
	   and (@LinkId is null or pf.LinkId = @LinkProfileId)
	   and (@AuthToken is null or t.AuthToken =@AuthToken)
	   and pf.IsSiteAccess = 1;
	
	
	End 
	
END

