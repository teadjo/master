import React from 'react'
import './Pagination.css'

const Pagination = ({ imagesPerPage, totalImages, paginate, currentPage }) => {
    const pageNumbers = [];
    const totalPages = Math.ceil(totalImages / imagesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const goToPreviousPage = () => currentPage > 1 && paginate(currentPage - 1);
    const goToNextPage = () => currentPage < totalPages && paginate(currentPage + 1);

    // Prikazujemo max 5 stranica
    const getVisiblePages = () => {
        if (totalPages <= 5) return pageNumbers;
        
        if (currentPage <= 3) {
            return [1, 2, 3, 4, '...', totalPages];
        } else if (currentPage >= totalPages - 2) {
            return [1, '...', totalPages-3, totalPages-2, totalPages-1, totalPages];
        } else {
            return [1, '...', currentPage-1, currentPage, currentPage+1, '...', totalPages];
        }
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="pagination">
            {/* Previous Button */}
            <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`pagination-btn prev ${currentPage === 1 ? 'disabled' : ''}`}
            >
                ←
            </button>

            {/* Page Numbers */}
            {visiblePages.map((number, index) => (
                number === '...' ? (
                    <span key={index} className="pagination-dots">...</span>
                ) : (
                    <button
                        key={index}
                        onClick={() => paginate(number)}
                        className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                    >
                        {number}
                    </button>
                )
            ))}

            {/* Next Button */}
            <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`pagination-btn next ${currentPage === totalPages ? 'disabled' : ''}`}
            >
                →
            </button>
        </div>
    );
};

export default Pagination;