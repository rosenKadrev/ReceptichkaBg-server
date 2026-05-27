const getFromEmail = () => process.env.EMAIL_USER;

const sendBrevoEmail = async (to, subject, html) => {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = getFromEmail();
    
    if (!fromEmail) {
        throw new Error('Sender email is missing. Set EMAIL_USER.');
    }

    const payload = {
        to: [{ email: to }],
        sender: { email: fromEmail, name: 'РецептичкаБг' },
        subject: subject,
        htmlContent: html
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Brevo API error (${response.status}): ${errorData?.message || 'Unknown error'}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/password-reset?token=${resetToken}`;

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        color: #ffffff;
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                        color: #333333;
                        line-height: 1.6;
                    }
                    .content h2 {
                        color: #667eea;
                        margin-top: 0;
                    }
                    .button-container {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .reset-button {
                        display: inline-block;
                        padding: 15px 40px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 16px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        transition: transform 0.2s;
                    }
                    .reset-button:hover {
                        transform: translateY(-2px);
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px 30px;
                        text-align: center;
                        color: #666666;
                        font-size: 14px;
                        border-top: 1px solid #e0e0e0;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .expiry {
                        color: #d9534f;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/wallpaper.jpg" alt="РецептичкаБг">
                        <h1>Нулиране на парола</h1>
                    </div>
                    
                    <div class="content">
                        <h2>Здравейте,</h2>
                        <p>Получихме заявка за нулиране на паролата за вашия акаунт в РецептичкаБг.</p>
                        <p>Ако сте направили тази заявка, моля кликнете на бутона по-долу, за да създадете нова парола:</p>
                        
                        <div class="button-container">
                            <a href="${resetUrl}" class="reset-button">Нулиране на паролата</a>
                        </div>
                        
                        <div class="warning">
                            <p style="margin: 0;"><strong>⏰ Важно:</strong> Този линк ще изтече след <span class="expiry">1 час</span>.</p>
                        </div>
                        
                        <p>Ако не можете да кликнете на бутона, копирайте и поставете следния линк в браузъра си:</p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        
                        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                            <strong>Не сте заявявали нулиране на парола?</strong><br>
                            Ако не сте направили тази заявка, моля игнорирайте този имейл. Вашата парола няма да бъде променена.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>С поздрави,<br><strong>Екипът на РецептичкаБг</strong></p>
                        <p style="margin-top: 15px; font-size: 12px; color: #999999;">
                            Това е автоматично генериран имейл. Моля, не отговаряйте на него.
                        </p>
                    </div>
                </div>
            </body>
            </html>
    `;

    return await sendBrevoEmail(email, 'Нулиране на парола - РецептичкаБг', html);
};

exports.sendWelcomeEmail = async (email, name) => {
    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        color: #ffffff;
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                        color: #333333;
                        line-height: 1.6;
                    }
                    .content h2 {
                        color: #667eea;
                        margin-top: 0;
                    }
                    .button-container {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .explore-button {
                        display: inline-block;
                        padding: 15px 40px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 16px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        transition: transform 0.2s;
                    }
                    .explore-button:hover {
                        transform: translateY(-2px);
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px 30px;
                        text-align: center;
                        color: #666666;
                        font-size: 14px;
                        border-top: 1px solid #e0e0e0;
                    }
                    .features {
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .feature-item {
                        margin: 15px 0;
                        padding-left: 30px;
                        position: relative;
                    }
                    .feature-item:before {
                        content: "✓";
                        position: absolute;
                        left: 0;
                        color: #667eea;
                        font-weight: bold;
                        font-size: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://vyywowzscsyjgtjwxznp.supabase.co/storage/v1/object/public/receptichka_bg/wallpaper.jpg" alt="РецептичкаБг">
                        <h1>Добре дошли в РецептичкаБг! 🎉</h1>
                    </div>
                    
                    <div class="content">
                        <h2>Здравейте, ${name}!</h2>
                        <p>Благодарим ви, че се регистрирахте в РецептичкаБг! Радваме се, че сте част от нашата кулинарна общност.</p>
                        
                        <p>Вашата регистрация беше успешна и вече можете да:</p>
                        
                        <div class="features">
                            <div class="feature-item">
                                <strong>Разглеждате хиляди рецепти</strong> - Открийте вкусни идеи за всяко време на деня
                            </div>
                            <div class="feature-item">
                                <strong>Споделяте собствени рецепти</strong> - Покажете кулинарните си таланти
                            </div>
                            <div class="feature-item">
                                <strong>Оценявате и коментирате</strong> - Взаимодействайте с другите готвачи
                            </div>
                            <div class="feature-item">
                                <strong>Запазвате любими рецепти</strong> - Създавайте своя персонална колекция
                            </div>
                        </div>
                        
                        <p>Готови ли сте да започнете кулинарното си приключение?</p>
                        
                        <div class="button-container">
                            <a href="${process.env.FRONTEND_URL}" class="explore-button">Разгледайте рецепти</a>
                        </div>
                        
                        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                            Ако имате въпроси или нужда от помощ, не се колебайте да се свържете с нас.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>Приятно готвене!<br><strong>Екипът на РецептичкаБг</strong></p>
                        <p style="margin-top: 15px; font-size: 12px; color: #999999;">
                            Това е автоматично генериран имейл. Моля, не отговаряйте на него.
                        </p>
                    </div>
                </div>
            </body>
            </html>
    `;

    return await sendBrevoEmail(email, 'Добре дошли в РецептичкаБг! 🎉', html);
};