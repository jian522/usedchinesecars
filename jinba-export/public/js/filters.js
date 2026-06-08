(function() {
    const filterToggle = document.getElementById('filterToggle');
    const filtersSidebar = document.getElementById('filtersSidebar');
    if (filterToggle && filtersSidebar) {
        filterToggle.addEventListener('click', () => filtersSidebar.classList.toggle('open'));
    }
})();
