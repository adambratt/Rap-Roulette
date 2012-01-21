$(function() {
	$('.rmrow').click(function() {
		if(!confirm('Are you sure you want to remove this item?')) return false;
		var p=new Object();
		p['id']=$(this).attr('rel');
		var obj=$(this);
		$.post($(this).attr('href'),p,function(data) {
			$(obj).parent().parent().remove();
		});
		return false;
	});
});
