const ImageModal = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-full max-h-full">
        <img
          src={src}
          alt="Full size preview"
          className="max-w-full max-h-[90vh] object-contain"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <a
            href={src}
            download={`image-${Date.now()}.jpg`}
            className="btn btn-sm btn-primary"
            onClick={(e) => e.stopPropagation()}
          >
            Save
          </a>
          <button onClick={onClose} className="btn btn-sm btn-ghost text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
