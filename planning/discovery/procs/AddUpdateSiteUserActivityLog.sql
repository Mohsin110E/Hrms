-- =============================================
-- Author:		KRishna
-- Create date: 12/10/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
-- =============================================
CREATE PROCEDURE AddUpdateSiteUserActivityLog 
(
   @IPAddress varchar(100) = null,
   @LogDate datetime = null,
   @ProfileId int,
   @LogType smallint = null,
   @LogRef varchar(500) = null
 
)
AS
BEGIN

	SET NOCOUNT ON;
	BEGIN TRANSACTION
	BEGIN TRY	


	Declare @LogTypeId Smallint
	Select @LogTypeId = ParameterId from system.Parameter where ParameterTypeId = 3 and  ParameterValue = @LogType

    insert into [usr].[SiteUserActivityLog] (IPAddress,LogDate,ProfileId,LogRef,LogTypeId)
    values (@IPAddress,@LogDate,@ProfileId,@LogRef,@LogTypeId)	 

    COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        if XACT_STATE() <> 0
            ROLLBACK TRANSACTION
             Insert into system.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
             SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateSiteUserActivityLog',GETUTCDATE()
             	 DECLARE @ErrorMessage VARCHAR(2000)
	             SELECT @ErrorMessage = ERROR_MESSAGE()
	             RAISERROR (@ErrorMessage, 16, 1)     
    END CATCH

END

