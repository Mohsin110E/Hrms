-- =============================================
-- Author:		krishna	
-- Create date: 10/16/2019
-- Description:	get login details
-- Exec GetProfileList null,null,null,null,4,'',0,50,1,'Name',null,''
-- =============================================
CREATE PROCEDURE [dbo].[GetProfileList]
	(
	   @Role varchar(100) = null,
	   @Department varchar(100) = null,
	   @SiteId varchar(100) = null,
	   @UserStatus varchar(100) = null,
	   @profileId int =null,
	   @Search varchar(100) = null,
	   @PageNum as int = 0,
	   @PageSize as int=25,
	   @SortOrder AS INT = 1,
	   @SortBy VARCHAR(50) = 'EmpCode',
	   @UserId varchar(Max) = null,
	   @TotalRowCount as bigint OUTPUT
	)
AS
BEGIN

	SET NOCOUNT ON;
  
	Begin 

	   create table #tmpUserLinked
       (
       ProfileId	int,
       EmpCode	varchar(20),
       UserName	varchar(100),
       StatusValue	int,
       StatusName	varchar(100),
       IsMyContact	bit
       )
       
	   Declare @userType int = 0
	   select @userType = UserTypeId from usr.SiteUser where ProfileId = @profileId
       
	   if(@userType = 4)
	   BEGIN
	   Insert into #tmpUserLinked (ProfileId)
       select ProfileId FROM usr.Profile
	   END
	   ELSE
	   BEGIN
       Insert into #tmpUserLinked (ProfileId)
       select ProfileId FROM dbo.GetReportingToUserIdFn(@profileId)
	   END
       
	   Declare  @userLevel int 
	  Select @userlevel = TypeLevel from ProfileView where ProfileId = @profileId

	   Declare @TempTable table (ProfileId int,RoleId tinyInt,RoleName  varchar(100),RoleLevel  tinyInt,
	   UserTypeId  smallInt,StatusId  smallInt,Name  varchar(100),LastName  varchar(100),
	   Designation varchar(100),Email varchar(500),ContactNo varchar(100),DOB  date,StatusValue int,
	   Status varchar(200),UserTypeText varchar(200),SiteUserId int,DepartmentName varchar(200),SiteName nvarchar(200),EmployeeCode varchar(20),
	   folderpath varchar(500),LinkId int,IsUpdated bit,IsPayrollAdded bit,IsPayrollGenerated bit,SiteId int,
	   IsPersonIDNumberAdded bit,IsRoutingNumberAdded bit,IsAccountNoAdded bit,Location varchar(200),UserName varchar(500))

	   insert into @TempTable
       SELECT distinct pf.ProfileId,CAST(0 AS tinyint) as RoleId,'' As RoleName,CAST(0 AS tinyint) as RoleLevel,
	   su.UserTypeId,pf.StatusId,
	   pf.Name,isnull(pf.LastName,''),em.Designation,pf.Email,pf.ContactNo,pf.DOB
	  ,pm.ParameterValue StatusValue,pm.Text Status,
	   us.Name UserTypeText,su.SiteUserId ,STUFF((SELECT Distinct ', ' + CAST(s.DepartmentName AS VARCHAR(10)) [text()]
         FROM  master.Department s(NOLOCK)  
		  inner join usr.ProfileDepartment d ON d.DepartmentId  = s.DepartmentId 
		  where d.ProfileId =pf.ProfileId
		 FOR XML PATH(''), TYPE)
         .value('.','NVARCHAR(MAX)'),1,2,' ') as DepartmentName,
		 s.SiteName,em.EmployeeCode,fd.FolderPath,pf.LinkId,pf.IsUpdated,
		 (case when py.EmployeePayrollMasterId is not null 
		 then cast (1 as bit) else cast (0 as bit) end) IsPayrollAdded,		 
		 (case when pl.EmployeePayrollId is not null
		 then cast (1 as bit) else cast (0 as bit) end) IsPayrollGenerated,
		 em.SiteId,(case when em.PersonIDNumber is not null then cast (1 as bit) else cast (0 as bit) end) as IsPersonIDNumberAdded,
		 (case when acc.RoutingNumber is not null then cast (1 as bit) else cast (0 as bit) end) as IsRoutingNumberAdded,
		 (case when acc.AccountNo is not null then cast (1 as bit) else cast (0 as bit) end) as IsAccountNoAdded,ISNULL(plc.Text,'') As Location,
		 (case when su.UserName is null then null else dbo.decrypt(ISNULL(su.UserName,'')) end ) As UserName
	   from  usr.Profile pf with(nolock) 
	   inner join #tmpUserLinked TL on TL.ProfileId = pf.ProfileId
	   left join usr.SiteUser su with(nolock)  on su.ProfileId = pf.ProfileId	 
	  -- left Join master.Role sr with(nolock) on sr.RoleId = su.RoleId
	   left Join system.Parameter pm with(nolock) on pm.ParameterId = pf.StatusId
	   left Join master.UserType us with(nolock) on us.UserTypeId = su.UserTypeId
	   Join usr.Employee em with(nolock) on em.ProfileId = pf.ProfileId
	   Left Join usr.ProfileDepartment pd   with (nolock)  on pd.profileId = pf.ProfileId	
	   Left Join master.Department dp with (nolock) on dp.departmentId = pd.departmentId
	   Left Join master.Site s with(nolock) on s.SiteId =em.SiteId
	   Left Join usr.Dependant usd (nolock) on pf.ProfileId = usd.DependantProfileId
	   left join master.Filedoc fd with(nolock) on fd.FileDocId = pf.PhotoId
	   left join usr.EmployeePayrollMaster py (nolock) on pf.ProfileId = py.ProfileId
	   Left join usr.EmployeePayroll pl (nolock) on pf.ProfileId = pl.ProfileId  and Month(pl.ProcessedOn)= Month(Getutcdate()) 
	   left join usr.Account acc (nolock) on pf.ProfileId = acc.ProfileId 
	   left Join system.Parameter plc with(nolock) on plc.ParameterId = em.Location
	   where --(@Role is null or sr.roleId  in (select value from dbo.SplitFn(@Role ,',') )) and 
	   (@Department is null or dp.DepartmentId in (select value from dbo.SplitFn(@Department ,',') ))
		 and (@UserStatus is null or pm.ParameterValue in (select value from dbo.SplitFn(@UserStatus ,',') ))
		 and (@SiteId is null or s.SiteId is null or s.SiteId in (select value from dbo.SplitFn(@SiteId ,',') ))
		 and usd.DependantProfileId is null
		 --and (@profileId is null or pf.ProfileId =  @profileId)
		 and (@UserId is null or pf.ProfileId in (select value from dbo.SplitFn(@UserId ,',') ))
		  and ( @Search  is null or( pf.Name like '%'+@Search+'%' or pf.LastName like '%'+@Search+'%'  or pf.MiddleName like  '%'+@Search+'%'
		  ) or em.EmployeeCode like '%'+@Search+'%') 
		-- and (pf.ProfileId = @profileId or em.ReportingTo = @profileId or us.TypeLevel < @userlevel) 
		 order by em.EmployeeCode desc


		 set @TotalRowCount=(select COUNT(1) from @TempTable)

	IF @PageNum >= @TotalRowCount
	SET @PageNum = 0

	    select * from @TempTable
		ORDER BY      
		CASE WHEN @SortBy =  'EmpCode' AND @SortOrder = 1 THEN EmployeeCode END ASC,		
        CASE WHEN @SortBy =  'EmpCode' AND @SortOrder = -1 THEN EmployeeCode END DESC,
		CASE WHEN @SortBy =  'Name' AND @SortOrder = 1  THEN  Name END ASC,
        CASE WHEN @SortBy =  'Name' AND @SortOrder = -1 THEN  Name END DESC,
		CASE WHEN @SortBy =  'UserTypeText' AND @SortOrder = 1 THEN UserTypeText END ASC,
        CASE WHEN @SortBy =  'UserTypeText' AND @SortOrder = -1 THEN UserTypeText END DESC,
		CASE WHEN @SortBy =  'Email' AND @SortOrder = 1 THEN Email END ASC,
        CASE WHEN @SortBy =  'Email' AND @SortOrder = -1 THEN Email END DESC,
		CASE WHEN @SortBy =  'DOB' AND @SortOrder = 1 THEN DOB END ASC,
        CASE WHEN @SortBy =  'DOB' AND @SortOrder = -1 THEN DOB END DESC,
		CASE WHEN @SortBy =  'Department' AND @SortOrder = 1 THEN DepartmentName END ASC,
        CASE WHEN @SortBy =  'Department' AND @SortOrder = -1 THEN DepartmentName END DESC	   ,
		CASE WHEN @SortBy =  'ContactNo' AND @SortOrder = 1 THEN ContactNo END ASC,
        CASE WHEN @SortBy =  'ContactNo' AND @SortOrder = -1 THEN ContactNo END DESC	   ,
		CASE WHEN @SortBy =  'Status' AND @SortOrder = 1 THEN Status END ASC,
        CASE WHEN @SortBy =  'Status' AND @SortOrder = -1 THEN Status END DESC	    ,
		CASE WHEN @SortBy =  'SiteName' AND @SortOrder = 1 THEN SiteName END ASC,
        CASE WHEN @SortBy =  'SiteName' AND @SortOrder = -1 THEN SiteName END DESC,
		CASE WHEN @SortBy =  'Location' AND @SortOrder = 1 THEN Location END ASC,
        CASE WHEN @SortBy =  'Location' AND @SortOrder = -1 THEN Location END DESC,	  
		CASE WHEN @SortBy =  'UserName' AND @SortOrder = 1 THEN UserName END ASC,
        CASE WHEN @SortBy =  'UserName' AND @SortOrder = -1 THEN UserName END DESC	  	  
        OFFSET @PageNum ROWS FETCH NEXT (CASE WHEN @PageSize = 0 AND @TotalRowCount = 0 THEN 1 WHEN @PageSize = 0 THEN @TotalRowCount ELSE @PageSize END) ROWS ONLY

	End
	 SET NOCOUNT OFF;   

END










