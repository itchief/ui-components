function todoUpdate() {
  const section = $('.todo-sections').val();
  if (section === 'all') {
    $('.todo-item')
      .filter('[data-state="canceled"]')
        .addClass('todo-item-hide')
      .end()
      .not('[data-state="canceled"]')
        .removeClass('todo-item-hide');
    return false;
  }
  $('.todo-item')
    .not('[data-state="' + section + '"]')
      .addClass('todo-item-hide')
    .end()
    .filter('[data-state="' + section + '"]')
      .removeClass('todo-item-hide');
}

$(document).on('change', '.todo-sections', todoUpdate);
$(document).on('click', '.todo-complete', function() {
  $(this).closest('.todo-item').attr('data-state', 'completed');
});
$(document).on('click', '.todo-cancel', function() {
  $(this).closest('.todo-item').attr('data-state', 'canceled');
});
$(document).on('click', '.todo-return', function() {
  $(this).closest('.todo-item').attr('data-state', 'active');
});

function todoCreate(text) {
  return $('<li>', {class: 'todo-item', 'data-state': 'active'})
    .append('<span class="todo-text">' + text + '</span>')
    .append('<span class="todo-return"></span>')
    .append('<span class="todo-complete"></span>')
    .append('<span class="todo-cancel"></span>');
}

$(document).on('click', '.todo-add-btn', function() {
  const text = $('.todo-add').val();
  if (!text.length) return false;
  $('.todo-add').val('');
  $('.todo-list').append(todoCreate(text));
});

var dragging = null;

$('.todo-item').on('dragstart', function(e) {
  dragging = this;
  window.setTimeout(function(){
    $(dragging).addClass('d-none');
  },0);
})

$('.todo-item').on('dragend', function(e) {
  $(this).removeClass('d-none');
})

$('.todo-item').on('dragover', function(e) {
  return false;
})

$('.todo-item').on('dragenter', function(e) {
  $(this).addClass('hovered');
})

$('.todo-item').on('dragleave', function(e) {
  $(this).removeClass('hovered');
})


$('.todo-item').on('drop', function(e) {
  $(this).removeClass('hovered');
  $(this).after(dragging);
  dragging = null;
})
