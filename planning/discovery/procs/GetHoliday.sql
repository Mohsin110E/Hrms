-- =============================================
-- Author		: Krishna
-- Create date	: 11-14-2019
-- Description	: To the detailed list of holiday
-- Test Case	: EXEC GetHoliday 0
-- =============================================
CREATE PROCEDURE [dbo].[GetHoliday]
@SiteId int = 0,
@ProfileId int  =null

AS
BEGIN
	SET NOCOUNT ON;

	if(@siteId = 0)
	   set @siteId = null;

	SELECT  HL.Date,convert(varchar(8),cast(HL.Date as date),112) as DateSort,
	 H.HolidayListId, H.HolidayName, DATENAME(dw,HL.Date) AS [DayOfWeek],
	  cast((case when HL.Date <= cast(getdate() as date) then 0 else 1 end) as bit) as [IsEditable]
	 , '[' +
		STUFF((SELECT ',{"SiteId":' + CAST(H1.SiteId AS VARCHAR(10)) + ',"SiteName":"'+ SUS.SiteName + '"}' [text()]
				 FROM system.HolidayCalendar H1
				 LEFT JOIN master.Site SUS ON SUS.SiteId = H1.SiteId
				 WHERE H1.Date = HL.Date
				 FOR XML PATH(''), TYPE)
				.value('.','NVARCHAR(MAX)'),1,1,'') +']' AS SiteDetail
		FROM master.HolidayList H
		LEFT JOIN system.HolidayCalendar HL ON HL.HolidayListId = H.HolidayListId
		WHERE 
		 ((@SiteId is null and @ProfileId is null) or ( @SiteId  =HL.SiteId or HL.ProfileId  =@ProfileId))
		 AND HL.WOFListId IS NULL
		GROUP BY HL.Date, H.HolidayListId, H.HolidayName
		order by HL.Date desc
END

