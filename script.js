$(document).ready(function () {
    let moviesData = [];
    let isImportBangerActive = false;
    let isImportNavetActive = false;

    $('#movies-container').empty();

    function loadMovies() {
        const goodNote = parseFloat($('#goodNote').val());
        const badNote = parseFloat($('#badNote').val());
        const origineFilm = $('#FiltrePays').val();
        const niveau = $('#FiltreNiveau').val();
        const noteMin = $('#noteMin').val();
        const noteMax = $('#noteMax').val();

        if (isNaN(goodNote) || isNaN(badNote)) {
            alert("Veuillez entrer des valeurs numériques pour les notes.");
            return;
        }

        let url = 'http://localhost:80/api/films?';  // Ajusté pour utiliser /api/films au lieu de /films
        if (isImportBangerActive) {
            url += `noteMin=4.2&`;
        } else {
            if (origineFilm) url += `origine=${origineFilm}&`;
            if (niveau) url += `niveau=${niveau}&`;
            if (noteMin) url += `noteMin=${noteMin}&`;
            if (noteMax) url += `noteMax=${noteMax}&`;
        }

        url = url.slice(0, -1);

        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                moviesData = response;
                displayMovies(moviesData);
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors du chargement des films :", error);
                alert("Erreur lors du chargement des films. Vérifie l'URL du back-end ou le serveur.");
            }
        });
    }

    function displayMovies(movies) {
        const origineFilm = $('#FiltrePays').val();

        $('#movies-container').empty();

        const filteredMovies = movies.filter(movie => {
            if (!origineFilm || origineFilm === "TOUS") return true;
            return movie.origine && movie.origine.trim() === origineFilm.trim();
        });

        filteredMovies.forEach(movie => {
            let movieCardClass = 'movie-card';
            let showDetails = true;
            let templateId = 'movie-template';

            if (movie.note >= 4.2 && isImportBangerActive) {
                templateId = 'banger-template';
                movieCardClass = 'movie-card movie-card_banger';
            } else if (movie.note < parseFloat($('#badNote').val()) && isImportNavetActive) {
                templateId = 'navets';
                movieCardClass = 'movie-card movie-card_navet_border';
                showDetails = false;
            }

            const template = document.getElementById(templateId);
            const instance = template.content.cloneNode(true);

            const movieCardElement = instance.querySelector('.movie-card');
            if (movieCardElement) {
                movieCardElement.className = movieCardClass;
                movieCardElement.setAttribute('data-id', movie.id);
            }

            const movieDetails = instance.querySelector('.movie-details');
            if (movieDetails && templateId === 'movie-template') {
                movieDetails.style.display = showDetails ? '' : 'none';
            }

            if (templateId !== "navets") {
                const properties = ['nom', 'dateDeSortie', 'realisateur', 'note', 'notePublic', 'compagnie', 'description', 'lienImage', 'origine'];
                properties.forEach(prop => {
                    if (movie.hasOwnProperty(prop)) {
                        const element = instance.querySelector(`.${prop}`);
                        if (element) {
                            if (prop === 'lienImage' && movie[prop]) {
                                element.src = movie[prop];
                                element.alt = `Affiche du film ${movie.nom}`;
                            } else if (prop === 'description') {
                                element.textContent = "Description: " + (movie[prop] || 'N/A');
                            } else if (prop === 'note') {
                                const noteText = (movie[prop] !== null && movie[prop] !== undefined) ? movie[prop].toFixed(1) + "/5" : "N/A";
                                element.innerHTML = `Note: ${noteText} ` + getStars(movie[prop]);
                            } else {
                                element.textContent = movie[prop] || 'N/A';
                            }
                        }
                    }
                });

                const noteDifferenceElement = instance.querySelector('.noteDifference');
                if (noteDifferenceElement) {
                    if (movie.notePublic !== null && movie.notePublic !== undefined) {
                        const difference = Math.abs(movie.note - movie.notePublic).toFixed(1);
                        noteDifferenceElement.textContent = difference;
                    } else {
                        noteDifferenceElement.textContent = 'Note public indisponible';
                    }
                }
            } else {
                instance.querySelector('.nom').textContent = movie.nom;
                instance.querySelector('.lienImage').src = movie.lienImage;
                instance.querySelector('.lienImage').alt = `Affiche du film ${movie.nom}`;
            }

            const deleteButton = instance.querySelector('.delete-button');
            if (deleteButton) {
                deleteButton.addEventListener('click', function () {
                    const movieId = movie.id;
                    if (confirm("Voulez-vous vraiment supprimer ce film ?")) {
                        deleteMovie(movieId);
                    }
                });
            }

            const editButton = instance.querySelector('.edit-button');
            if (editButton) {
                editButton.addEventListener('click', function () {
                    const movieCard = $(this).closest('.movie-card');
                    const movieId = movieCard.attr('data-id');

                    $('#edit-film-modal').data('id', movieId);

                    const movieData = {
                        nom: movieCard.find('.nom').text(),
                        dateDeSortie: movieCard.find('.dateDeSortie').text(),
                        realisateur: movieCard.find('.realisateur').text(),
                        note: parseFloat(movieCard.find('.note').text().split('/')[0] || 0),
                        notePublic: parseFloat(movieCard.find('.notePublic').text() || 0),
                        compagnie: movieCard.find('.compagnie').text(),
                        description: movieCard.find('.description').text().replace("Description: ", ""),
                        origine: movieCard.find('.origine').text(),
                        lienImage: movieCard.find('.lienImage').attr('src')
                    };

                    $('#edit-nom').val(movieData.nom);
                    $('#edit-dateDeSortie').val(movieData.dateDeSortie);
                    $('#edit-realisateur').val(movieData.realisateur);
                    $('#edit-note').val(movieData.note);
                    $('#edit-notePublic').val(movieData.notePublic);
                    $('#edit-compagnie').val(movieData.compagnie);
                    $('#edit-description').val(movieData.description);
                    $('#edit-origine').val(movieData.origine);
                    $('#edit-lienImage').val(movieData.lienImage);

                    $('#edit-film-modal').show();
                });
            }

            $('#movies-container').append(instance);
        });
    }

    const getStars = (rating) => {
        if (rating === null || rating === undefined || isNaN(rating)) {
            return "N/A";
        }
        const starCount = Math.floor(rating);
        let stars = "";
        for (let i = 0; i < starCount; i++) {
            stars += "<span class='star'>⭐</span>";
        }
        return stars;
    };

    function updateMovies() {
        displayMovies(moviesData);
    }

    function deleteMovie(movieId) {
        $.ajax({
            url: `http://localhost:80/api/films/${movieId}`,  // Ajusté pour utiliser /api/films
            type: 'DELETE',
            success: function (response) {
                console.log("Film supprimé avec succès :", response);
                alert("Film supprimé avec succès !");
                loadMovies();
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors de la suppression du film :", error);
                alert("Erreur lors de la suppression du film.");
            }
        });
    }

    $('#importBanger').on('click', function () {
        isImportBangerActive = !isImportBangerActive;
        $('#importNavets').removeClass('active');
        isImportNavetActive = false;
        $(this).toggleClass('active');
        loadMovies();
    });

    $('#importNavets').on('click', function () {
        isImportNavetActive = !isImportNavetActive;
        $('#importBanger').removeClass('active');
        isImportBangerActive = false;
        $(this).toggleClass('active');
        loadMovies();
    });

    $('#clearButton').on('click', function () {
        isImportBangerActive = false;
        isImportNavetActive = false;
        $('#importBanger').removeClass('active');
        $('#importNavets').removeClass('active');
        $('#FiltrePays').val('').prop('selectedIndex', 0);
        $('#FiltreNiveau').val('');
        $('#noteMin').val('');
        $('#noteMax').val('');
        $('#movies-container').empty();
    });

    $('#loadMoviesButton').on('click', function () {
        loadMovies();
    });

    $('#appliquerFiltres').on('click', function () {
        loadMovies();
    });

    $('.close').on('click', function () {
        $('#edit-film-modal').hide();
    });

    $('#edit-film-form').on('submit', function (e) {
        e.preventDefault();

        const movieId = $('#edit-film-modal').data('id');
        console.log("ID du film à modifier :", movieId);

        const updatedData = {
            nom: $('#edit-nom').val(),
            dateDeSortie: $('#edit-dateDeSortie').val(),
            realisateur: $('#edit-realisateur').val(),
            note: parseFloat($('#edit-note').val()),
            notePublic: parseFloat($('#edit-notePublic').val()),
            compagnie: $('#edit-compagnie').val(),
            description: $('#edit-description').val(),
            origine: $('#edit-origine').val(),
        };

        const lienImage = $('#edit-lienImage').val();
        if (lienImage) {
            updatedData.lienImage = lienImage;
        }

        if (!/^\d{4}$/.test(updatedData.dateDeSortie)) {
            alert("Veuillez entrer une année valide (ex: 1960).");
            return;
        }

        $.ajax({
            url: `http://localhost:80/api/films/${movieId}`,  // Ajusté pour utiliser /api/films
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function (response) {
                alert('Film modifié avec succès !');
                $('#edit-film-modal').hide();
                loadMovies();
            },
            error: function (xhr, status, error) {
                console.error("Erreur lors de la modification du film :", error);
                alert("Erreur lors de la modification du film.");
            }
        });
    });
});