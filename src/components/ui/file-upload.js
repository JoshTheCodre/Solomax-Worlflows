import { CldUploadWidget } from 'next-cloudinary';

export function FileUpload({ onUpload }) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      onUpload={(result, widget) => {
        onUpload(result.info);
        widget.close();
      }}
      options={{
        maxFiles: 5,
        sources: ['local', 'url', 'camera'],
        clientAllowedFormats: ['image/*', 'video/*', 'application/pdf'],
        maxFileSize: 10000000, // 10MB
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Upload File
        </button>
      )}
    </CldUploadWidget>
  );
}
