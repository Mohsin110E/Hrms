-- =============================================
-- Author:		Mohseena
-- Create date: 23/06/2020
-- Description:	<Creating Stored Procedure for GetShiftMaster>
-- Test Case  : [GetShiftMaster] 0
-- =============================================
CREATE PROCEDURE [dbo].[GetShiftMaster]
	-- Add the parameters for the stored procedure here
	@ShiftId AS INT = NULL
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

	-- Insert statements for procedure here
	SELECT SUS.ShiftId,
		SUS.ShiftName,
		SUS.StartTime,
		SUS.EndTime,
		SUS.LateMinutes,
		SUS.HalfDayMinutes,
		SUS.CreatedBy,
		SUS.CreatedOn,
		SUS.ModifiedBy,
		SUS.ModifiedOn,
		SUS.AltStartTime,
		SUS.AltEndTime
	FROM master.Shift(NOLOCK) SUS
	WHERE (
			@ShiftId IS NULL
			OR SUS.ShiftId = @ShiftId
			)
	ORDER BY ShiftId DESC
		--order by ShiftName DESC
END
