
function todoUpdate() {
  const section = $('.todo__options').val();
  $('.todo__item')
    .not('[data-state="' + section + '"]')
      .addClass('todo__item_hide')
    .end()
    .filter('[data-state="' + section + '"]')
      .removeClass('todo__item_hide');
}

$(document).on('change', '.todo__options', todoUpdate);

$(document).on('click', '.todo__action', function(e) {
  const action = $(e.target).attr('data-action');
  $(this).closest('.todo__item').attr('data-state', action);
});

function todoCreate(text) {
  return $('<li>', {class: 'todo__item', 'data-state': 'active'})
    .append('<span class="todo__task">' + text + '</span>')
    .append('<span class="todo__action_restore" data-action="active"></span>')
    .append('<span class="todo__action_complete" data-action="completed"></span>')
    .append('<span class="todo__action_delete" data-action="deleted"></span>');
}

$(document).on('click', '.todo__add', function() {
  const text = $('.todo__text').val();
  if (!text.length) return false;
  $('.todo__text').val('');
  $('.todo__items').append(todoCreate(text));
});

var dragging = null;

$('.todo__item').on('dragstart', function(e) {
  dragging = this;
  window.setTimeout(function(){
    $(dragging).addClass('d-none');
  },0);
})

$('.todo__item').on('dragend', function(e) {
  $(this).removeClass('d-none');
})

$('.todo__item').on('dragover', function(e) {
  return false;
})

$('.todo__item').on('dragenter', function(e) {
  $(this).addClass('hovered');
})

$('.todo__item').on('dragleave', function(e) {
  $(this).removeClass('hovered');
})


$('.todo__item').on('drop', function(e) {
  $(this).removeClass('hovered');
  $(this).after(dragging);
  dragging = null;
})
