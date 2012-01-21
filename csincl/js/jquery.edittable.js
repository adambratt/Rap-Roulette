$(function() {
	bindhover();
	bindclick();
	$('tr','.editable').append('<td><a href="#" class="dellink"><img src="'+icon+'" border=0 /></a></td>');
	$('.dellink','.editable').click(function() {
		deleteitem(this);
		return false;
	});
	var bob=$('tr','.editable').eq(0);
	$('td',bob).remove();
	$('[rel=select]').children('select').hide();

});

function bindhover() {
	$('td','.editable').hover(function() {
		if($(this).attr('name')==null) return;
		$(this).css('border','thin solid red');
	}, function() {
		$(this).css('border','thin solid transparent');
	});
}

function recolor() {
	var i=2;
	$('tr','.editable').removeClass('even');
	$('tr','.editable').each(function() {
		if(i%2) $(this).addClass('even');
		i++;
	});
}

function unbindhover() {
	$('td','.editable').unbind();
}

function updateitem(obj) {
	var p=new Object();
	p['value']=$(obj).val();
	p['key']=$(obj).attr('name');
	p['type']=type;
	p['id']=$(obj).parent().parent().attr('rel');
	$.post(url,p,function(data) {
	});
}

function deleteitem(obj) {
	if(!confirm('Are you sure you want to delete this entry?')) return;
	var id=$(obj).parent().parent().attr('rel');
	var p=new Object();
	p['id']=id;
	p['type']=type;
	p['action']='delete';
	$.post(url,p,function(data) {
		$(obj).parent().parent().remove();
		recolor();
	});
}

function bindclick() {
	$('td','.editable').click(function() {
		unbindhover();
		$(this).unbind('click');
		if($(this).attr('rel')=='bool') {
			if($(this).attr('name')==null) return true;
			var val=$(this).html();
			if(val=='Yes') {
				val=1;
				sel1=' selected="selected"';
				sel2='';
			}else{
				val=0;
				sel1='';
				sel2=' selected="selected"';
			}
			$(this).html('<select name="'+$(this).attr('name')+'"><option value=1'+sel1+'>Yes</option><option value=0'+sel2+'>No</option></select>');
			$('select',this).focus();
			$('select',this).blur(function() {
				var cval=$(this).val();
				if(cval==1) {
					cval='Yes';
				}else{
					cval='No';
				}
				$(this).parent().css('border','thin solid transparent');
				updateitem(this);
				$(this).parent().html(cval);
				bindhover();
				bindclick();
			});

			$('select',this).change(function() {
				var cval=$(this).val();
				if(cval==1) {
					cval='Yes';
				}else{
					cval='No';
				}
				$(this).parent().css('border','thin solid transparent');
				updateitem(this);
				$(this).parent().html(cval);
				bindhover();
				bindclick();
			});
		}else if($(this).attr('rel')=='select'){
			var clone=$(this).clone();
			clone.children().remove();
			var val=clone.text();
			var select=$(this).children("select");
			if(select.length == 1){
				$(this).html(select.show());
				select.children().each(function(){
					var h=$(this).html()
					//remove whitespace
					h=h.replace(/^\s+|\s+$/g,"");
					val=val.replace(/^\s+|\s+$/g,"");
					if(h==val){
						$(this).attr('selected', 'selected');
					}
				});
				select.focus();
				select.blur(function(){
					$(this).parent().css('border','thin solid transparent');
					updateitem(this);
					$(this).parent().html(select.children(':selected').html());
					bindhover();
					bindclick();
				})
			}
		}else if($(this).attr('rel')=='date'){
			//Requires the 3 external js includes and the css file in order to work properly
			if($(this).attr('name')==null) return true;
			var val=$(this).text();
			$(this).html("<input type='text' name='"+$(this).attr('name')+"' class='date-pick' value='"+val+"' readonly='readonly' style='border: none;' size='10' />");
			var picker=$('input',this);
			picker
				.datePicker({createButton:false})
					.bind(
						'click',
						function()
						{
							$(this).dpDisplay();
							this.blur();
							return false;
						}
					)
					.bind(
						'dateSelected',
						function(e, selectedDate, $td)
						{
							picker.parent().css('border','thin solid transparent');
							updateitem(this);
							picker.parent().html(picker.val());
							bindhover();
							bindclick();
						}
					)
					.bind(
						'dpClosed',
						function(e, selectedDate){
							picker.parent().css('border','thin solid transparent');
							picker.parent().html(picker.val());
							bindhover();
							bindclick();
						}
					);
			picker.click();
		}else{
			if($(this).attr('name')==null) return true;
			var val=$(this).text();
			var size=20;
			if(val.length < 25 && val.length > 1) size=val.length
			$(this).html('<input type="text" name="'+$(this).attr('name')+'" value="'+val+'" size="'+size+'" />');
			$('input',this).focus();
			$('input',this).blur(function() {
				$(this).parent().css('border','thin solid transparent');
				updateitem(this);
				$(this).parent().html($(this).val());
				bindhover();
				bindclick();
			})
		}
	});
}
