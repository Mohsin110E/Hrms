-- =============================================
-- Author:		<Gaurav Narkar>
-- Create date: <10-08-2019>
-- Description:	<Creating Stored Procedure for Document save>
-- exec [DeleteDocument] 69
-- =============================================

CREATE PROCEDURE DeleteDocument(
@DocumentId as int =0
)
AS
BEGIN
SET NOCOUNT ON;
BEGIN TRANSACTION
BEGIN TRY 

Delete from master.FileDocMapping where DocId = @DocumentId
Delete fd from  master.FileDoc fd inner join master.FileDocMapping fdm on fdm.FileDocId = fd.FileDocId where fdm.DocId = @DocumentId

delete from master.AdditinalDocumentValue where DocumentId = @DocumentId

delete from HRMS.Document where DocumentId = @DocumentId

COMMIT TRANSACTION
END TRY
BEGIN CATCH
		IF XACT_STATE() <> 0 
		BEGIN
			  ROLLBACK TRANSACTION
		END
		Insert into System.ExceptionLog (ErrorNumber, ErrorSeverity, ErrorState, ErrorProcedure, ErrorLine, ErrorMessage, ErrorFrom,CreatedOn)
		SELECT  ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_PROCEDURE(), ERROR_LINE(), ERROR_MESSAGE(), 'SP - DeleteDocument',GETDATE()
		DECLARE @ErrorMessage VARCHAR(2000)
		SELECT @ErrorMessage = ERROR_MESSAGE()
		RAISERROR ('Failed to Register', 16, 1)
	END CATCH;
END

