-- =============================================
-- Author:		MOhseena
-- Create date: GetConfiguration
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE GetConfiguration
	(
	  @ConfigurationId varchar(100) = null
	)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

		select ConfigurationId,Name,Value,ToValue
		from system.Configuration (nolock)
		where (@ConfigurationId is null or ConfigurationId in (select value from dbo.SplitFn(@ConfigurationId,',')))
END

