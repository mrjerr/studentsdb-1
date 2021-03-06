const mainTitle = $('#title');
const mainHeader = $('#header');
const mainSubHeader = $('#sub-header');
const mainContent = $('#content-column');
const mainFooter = $('#footer');
const mainSpinner = $('#spinner');

const modal = $('#myModal');
const modalCloseBtn = $('#modalCloseBtn');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const modalSpinner = $('#modalSpinner');


// WORK FUNCTIONS

function createForm(form, url, urlPrev, saveHistory, updLev, showReply) {
    initDateFields();
    modalCloseBtn.off('click').click(function() {
        modal.modal('hide');
        updatePage(urlPrev, saveHistory, updLev);
        return false;
    });
    form.find('input[name="cancel_button"]').click(function() {
        modal.modal('hide');
        updatePage(urlPrev, saveHistory, updLev);
        return false;
    });
    form.ajaxForm({
        'dataType': 'html',
        'beforeSend': function() {
            modalSpinner.show();
            modal.find(':input').prop("disabled", true);
        },
        'complete': function() {
            modal.find(':input').prop("disabled", false);
            modalSpinner.hide();
        },
        'error': function(jqXHR, textStatus, errorThrown) {alertAjaxError(textStatus, jqXHR.status,  errorThrown)},
        'success': function(data) {
            var html = $(data),
                msg = html.find('#block-body .alert'),
                newform = html.find('#block-content form');
            if (newform.length > 0) {
                if (!form.attr('action')) {form.attr('action', url)}
                modalBody.html(msg).append(newform);
                createForm(newform, url, urlPrev, saveHistory, updLev, showReply);
            } else {
                if (showReply) {
                    modalTitle.html(html.find('#block-title').text());
                    modalBody.html(html.find('#block-body').addClass('alert alert-info'));
                } else {
                    if (msg.hasClass('alert')) {
                        modalBody.html(msg);
                        if (msg.hasClass('alert-success')) {setTimeout(function() {modalCloseBtn.click()}, 500)}
                    } else {modalCloseBtn.click()}
                }
            }
        }
    });
    return false;
}

function modalForm(url, urlPrev, saveHistory, updLev, showReply) {
    $.ajax(url, {
        'dataType': 'html',
        'type': 'GET',
        'beforeSend': function() {mainSpinner.show()},
        'complete': function() {mainSpinner.hide()},
        'error': function(jqXHR, textStatus, errorThrown) {alertAjaxError(textStatus, jqXHR.status,  errorThrown)},
        'success': function(data) {
            if (data.startsWith("Exception")) {alertAjaxError('error', data, 'No data')}
            else {
                var html = $(data),
                form = html.find('#block-content form');
                if (form.length > 0) {
                    modalTitle.html(html.find('#block-title').text());
                    if (!form.attr('action')) {form.attr('action', url)}
                    modalBody.html(form);
                    createForm(form, url, urlPrev, saveHistory, updLev, showReply);
                    modal.modal({'keyboard': false, 'backdrop': false, 'show': true});
                    if (saveHistory) {history.pushState({'urlPrev': urlPrev}, document.title, url)}
                }
            }
        }
    });
    return false;
}

// updLev: 1 - content, 2 - sub-header + content, 3 - header + sub-header + content, 4 - header + sub-header + content + footer
function updatePage(url, saveHistory, updLev) {
    $.ajax(url, {
        'dataType': 'html',
        'type': 'GET',
        'beforeSend': function() {mainSpinner.show()},
        'complete': function() {mainSpinner.hide()},
        'error': function(jqXHR, textStatus, errorThrown) {alertAjaxError(textStatus, jqXHR.status,  errorThrown)},
        'success': function(data) {
            var html = $(data);
            mainTitle.text(html.find('#mainTitle').text());
            if (updLev > 2) {mainHeader.html(html.find('#header').html())}
            if (updLev > 1) {mainSubHeader.html(html.find('#sub-header').html())}
            mainContent.html(html.find('#content-column').html());
            if (updLev > 3) {mainFooter.html(html.find('#footer').html())}
            if (saveHistory) {history.pushState({'urlPrev': false}, document.title, url)}
        }
    });
    return false;
}

// password reset confirm
function checkRedirectForm() {
    var urlForm = $('#form_action').data('form-url');
    if (urlForm) {modalForm(urlForm, location.origin, false, 3, true)}
}

function alertAjaxError(err_type, err_code, err_text) {
    alert(gettext("There was an error on the server. Please, try again a bit later.")
        + '\n' + '\n' + err_type + ': ' + err_code + ' (' + err_text + ')')}


// INIT FUNCTIONS

function initDateFields() {
    $('input.dateinput')
        .datetimepicker({'format': 'YYYY-MM-DD'})
        .on('dp.hide', function() {$(this).blur()})
}

function initEventHandlers() {
    // login form, registration form, profile form, group select, lang select
    mainHeader
        .on('click', 'a.user-link', function() {
            modalForm(this.href, location.href, false, 3, false);
            return false;
        })
        .on('click', 'a.reply-link', function() {
            modalForm(this.href, location.href, false, 3, true);
            return false;
        })
        .on('change', '#group-selector select', function() {
            var group = $(this).val();
            if (group) {$.cookie('current_group', group, {'path': '/', 'expires': 365})}
            else {$.removeCookie('current_group', {'path': '/'})}
            updatePage(location.href, false, 1);
            return false;
        })
        .on('change', '#lang-selector select', function() {
            var lang = $(this).val();
            $.cookie('django_language', lang, {'path': '/', 'expires': 365});
            updatePage(location.href, false, 4);
            return false;
        });
    // tabs navigation links
    mainSubHeader
        .on('click', 'ul.nav-tabs a', function() {
            updatePage(this.href, true, 2);
            return false;
        });
    // student/group add/edit forms, send letter form, ordering/reversing links, journal marking
    mainContent
        .on('click', 'a.form-link', function() {
            modalForm(this.href, location.href, true, 1, false);
            return false;
        })
        .on('click', 'a.content-link', function() {
            updatePage(this.href, true, 1);
            return false;
        })
        .on('click', '.day-box input[type="checkbox"]', function(e) {
            var box = $(this),
                errorMsg = $('#errJournalSave');
            $.ajax(box.data('url'), {
                'type': 'POST',
                'async': true,
                'dataType': 'json',
                'data': {
                    'pk': box.data('student-id'),
                    'date': box.data('date'),
                    'present': box.is(':checked') ? '1': '',
                    'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()
                },
                'beforeSend': function() {mainSpinner.show()},
                'complete': function() {mainSpinner.hide()},
                'error': function() {errorMsg.show()},
                'success': function() {errorMsg.hide()}
            });
        });
    // password reset&change form
    modal
        .on('click', 'a.modal-link', function() {
            modalForm(this.href, location.href, false, 3, true);
            return false;
        });
}

function initHistory() {
    window.onpopstate = function(e) {
        var url = e.target.document.URL,
            urlPrev = e.state.urlPrev;
        if (urlPrev) {modalForm(url, urlPrev, false, 3, false)}
        else {
            if (modal.is(':visible')) {modal.modal('hide')}
            updatePage(url, false, 'sub-header');
        }
        return false;
    }
}


// MAIN

$(function() {
    initDateFields();
    initEventHandlers();
    initHistory();
    history.replaceState({'urlPrev': false}, document.title, location.origin);
    checkRedirectForm();
});
