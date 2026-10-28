-- =============================================
-- Author:		Krishna
-- Create date: 12/10/2019
-- Description:	<Description,,>
--select * from usr.SiteUser
-- =============================================
CREATE PROCEDURE AddUpdateProfileLinkId 
(
  @ProfileId int =null,
  @LinkId int= null
  
  )
AS
BEGIN

	SET NOCOUNT ON;
	BEGIN TRANSACTION
	BEGIN TRY	
	
	
	 UPDATE [usr].[Profile]
     SET 
     LinkId =@LinkId , IsUpdated =0
	 where ProfileId = @ProfileId


  
    COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        if XACT_STATE() <> 0
            ROLLBACK TRANSACTION
             Insert into system.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
             SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - AddUpdateSiteUserActivity',GETUTCDATE()
             	 DECLARE @ErrorMessage VARCHAR(2000)
	             SELECT @ErrorMessage = ERROR_MESSAGE()
	             RAISERROR (@ErrorMessage, 16, 1)     
    END CATCH
 --select @MessageText 
END

