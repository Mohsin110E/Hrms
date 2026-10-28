-- =============================================
-- Author		: krishna
-- Create date	: 14-11-2019
-- Description	: To get the weekly off list
-- Test Case	: EXEC GetWeeklyOffList 0
-- =============================================
CREATE PROCEDURE [dbo].[GetWeeklyOffList]
@Year smallint = null	,
@ProfileId int = null
AS
BEGIN
	SET NOCOUNT ON;
	
	SELECT WL.WOFListId,WL.WOFId,WL.[Year],WC.WOFCode,WC.[Description], '[' +
	STUFF((SELECT ',{"SiteId":' + CAST(SUS.SiteId AS VARCHAR(10)) + ',"SiteName":"'+ SUS.SiteName + '"}' [text()]
				 FROM master.Site SUS 
				 WHERE SUS.SiteId IN(SELECT Value FROM dbo.SplitFn(WL.SiteId,','))
				 FOR XML PATH(''), TYPE)
				.value('.','NVARCHAR(MAX)'),1,1,'') +']' AS SiteDetail
	FROM system.WeeklyOffList WL
	LEFT JOIN system.WeeklyOffConfig WC ON WC.WOFId = WL.WOFId
	WHERE (WL.Year = @Year OR @Year = 0)
	and ((@ProfileId is null and ProfileId is null ) or ProfileId = @ProfileId  )
END

